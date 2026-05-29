// =============================================================
// backend/src/services/reportes.service.js
// Lógica de negocio para reportes de consumo y proyección de stock
// =============================================================

const supabase = require('../../config/supabase');

/**
 * Aplica filtros de fecha a una query de Supabase si los parámetros están definidos.
 */
function aplicarFiltrosFecha(query, fecha_desde, fecha_hasta) {
  if (fecha_desde) query = query.gte('fecha', fecha_desde);
  if (fecha_hasta) query = query.lte('fecha', fecha_hasta);
  return query;
}

/**
 * Obtiene filas de historial_movimientos filtradas por tipo 'salida' y fechas opcionales.
 */
async function obtenerSalidas(columnas, fecha_desde, fecha_hasta) {
  let query = supabase
    .from('historial_movimientos')
    .select(columnas.join(', '))
    .eq('tipo', 'salida');

  query = aplicarFiltrosFecha(query, fecha_desde, fecha_hasta);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Consumo por período: suma de cantidad y total_gs agrupado por artículo.
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} params
 * @returns {Promise<Array<{ nombre: string, cantidad: number, total_gs: number }>>}
 */
async function consumoPorPeriodo({ fecha_desde, fecha_hasta } = {}) {
  const rows = await obtenerSalidas(
    ['articulo_nombre', 'cantidad', 'total_gs', 'fecha'],
    fecha_desde,
    fecha_hasta
  );

  const agrupado = {};
  rows.forEach(row => {
    if (!agrupado[row.articulo_nombre]) agrupado[row.articulo_nombre] = { cantidad: 0, total_gs: 0 };
    agrupado[row.articulo_nombre].cantidad += Number(row.cantidad);
    agrupado[row.articulo_nombre].total_gs += Number(row.total_gs);
  });

  return Object.entries(agrupado)
    .map(([nombre, vals]) => ({ nombre, ...vals }))
    .sort((a, b) => b.total_gs - a.total_gs);
}

/**
 * Consumo por departamento: suma de cantidad y total_gs agrupado por departamento.
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} params
 * @returns {Promise<Array<{ nombre: string, cantidad: number, total_gs: number }>>}
 */
async function consumoPorDepartamento({ fecha_desde, fecha_hasta } = {}) {
  const rows = await obtenerSalidas(
    ['departamento_nombre', 'cantidad', 'total_gs', 'fecha'],
    fecha_desde,
    fecha_hasta
  );

  const agrupado = {};
  rows.forEach(row => {
    if (!agrupado[row.departamento_nombre]) agrupado[row.departamento_nombre] = { cantidad: 0, total_gs: 0 };
    agrupado[row.departamento_nombre].cantidad += Number(row.cantidad);
    agrupado[row.departamento_nombre].total_gs += Number(row.total_gs);
  });

  return Object.entries(agrupado)
    .map(([nombre, vals]) => ({ nombre, ...vals }))
    .sort((a, b) => b.total_gs - a.total_gs);
}

/**
 * Top artículos más consumidos por cantidad.
 * @param {{ fecha_desde?: string, fecha_hasta?: string, limit?: number }} params
 * @returns {Promise<Array<{ nombre: string, cantidad: number, total_gs: number }>>}
 */
async function masConsumidos({ fecha_desde, fecha_hasta, limit = 10 } = {}) {
  const rows = await obtenerSalidas(
    ['articulo_nombre', 'cantidad', 'total_gs', 'fecha'],
    fecha_desde,
    fecha_hasta
  );

  const agrupado = {};
  rows.forEach(row => {
    if (!agrupado[row.articulo_nombre]) agrupado[row.articulo_nombre] = { cantidad: 0, total_gs: 0 };
    agrupado[row.articulo_nombre].cantidad += Number(row.cantidad);
    agrupado[row.articulo_nombre].total_gs += Number(row.total_gs);
  });

  return Object.entries(agrupado)
    .map(([nombre, vals]) => ({ nombre, ...vals }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
}

/**
 * Valor total de salidas en el período.
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} params
 * @returns {Promise<{ total_gs: number }>}
 */
async function valorTotal({ fecha_desde, fecha_hasta } = {}) {
  const rows = await obtenerSalidas(['total_gs'], fecha_desde, fecha_hasta);

  const total = rows.reduce((acc, row) => acc + Number(row.total_gs), 0);
  return { total_gs: total };
}

/**
 * Proyección de stock: estima días restantes de cada artículo basado en consumo de los últimos 30 días.
 * @returns {Promise<Array<{ nombre: string, stock_actual: number, stock_minimo: number, consumo_diario: number, dias_restantes: number|null, estado: string }>>}
 */
async function proyeccionStock() {
  // Step 1: artículos activos
  const { data: articulos, error: errorArticulos } = await supabase
    .from('articulos')
    .select('id, nombre, stock_actual, stock_minimo')
    .eq('activo', true);

  if (errorArticulos) throw new Error(errorArticulos.message);

  // Step 2: salidas de los últimos 30 días
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const fechaDesde = hace30Dias.toISOString().slice(0, 10);

  const { data: salidas, error: errorSalidas } = await supabase
    .from('historial_movimientos')
    .select('articulo_nombre, cantidad')
    .eq('tipo', 'salida')
    .gte('fecha', fechaDesde);

  if (errorSalidas) throw new Error(errorSalidas.message);

  // Step 3: consumo total por artículo en los últimos 30 días
  const consumo30 = {};
  salidas.forEach(row => {
    if (!consumo30[row.articulo_nombre]) consumo30[row.articulo_nombre] = 0;
    consumo30[row.articulo_nombre] += Number(row.cantidad);
  });

  // Steps 4 y 5: calcular dias_restantes y estado para cada artículo
  const resultado = articulos.map(art => {
    const total30 = consumo30[art.nombre] || 0;
    const consumo_diario = total30 / 30;
    const dias_restantes = consumo_diario > 0 ? Math.floor(art.stock_actual / consumo_diario) : null;

    let estado;
    if (art.stock_actual <= art.stock_minimo) {
      estado = 'critico';
    } else if (dias_restantes !== null && dias_restantes <= 15) {
      estado = 'bajo';
    } else {
      estado = 'ok';
    }

    return {
      nombre: art.nombre,
      stock_actual: art.stock_actual,
      stock_minimo: art.stock_minimo,
      consumo_diario: Number(consumo_diario.toFixed(2)),
      dias_restantes,
      estado,
    };
  });

  // Ordenar por dias_restantes ASC, nulls al final
  resultado.sort((a, b) => {
    if (a.dias_restantes === null && b.dias_restantes === null) return 0;
    if (a.dias_restantes === null) return 1;
    if (b.dias_restantes === null) return -1;
    return a.dias_restantes - b.dias_restantes;
  });

  return resultado;
}

/**
 * Genera un workbook de Excel con 5 hojas de reporte.
 * ExcelJS se importa de forma lazy para no romper el módulo si no está instalado.
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} params
 * @returns {Promise<import('exceljs').Workbook>}
 */
async function generarExcel({ fecha_desde, fecha_hasta } = {}) {
  const ExcelJS = require('exceljs');
  const params = { fecha_desde, fecha_hasta };

  // Obtener todos los datos en paralelo
  const [periodo, departamento, masConsumidosData, valorTotalData, proyeccion] = await Promise.all([
    consumoPorPeriodo(params),
    consumoPorDepartamento(params),
    masConsumidos(params),
    valorTotal(params),
    proyeccionStock(),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Gestión Tajy';
  workbook.created = new Date();

  // Aplica estilo de encabezado rojo con texto blanco y ajusta anchos
  function estilizarEncabezados(worksheet, columnas) {
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B1A1A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    columnas.forEach((col, i) => {
      worksheet.getColumn(i + 1).width = col.width || 20;
    });
    headerRow.height = 20;
  }

  // Hoja 1: Consumo por Período
  {
    const ws = workbook.addWorksheet('Consumo por Período');
    ws.columns = [
      { header: 'Artículo',          key: 'nombre',   width: 35 },
      { header: 'Cantidad',          key: 'cantidad',  width: 15 },
      { header: 'Valor Total (Gs.)', key: 'total_gs',  width: 20 },
    ];
    estilizarEncabezados(ws, ws.columns);
    periodo.forEach(r => ws.addRow(r));
  }

  // Hoja 2: Consumo por Departamento
  {
    const ws = workbook.addWorksheet('Por Departamento');
    ws.columns = [
      { header: 'Departamento',      key: 'nombre',   width: 30 },
      { header: 'Cantidad',          key: 'cantidad',  width: 15 },
      { header: 'Valor Total (Gs.)', key: 'total_gs',  width: 20 },
    ];
    estilizarEncabezados(ws, ws.columns);
    departamento.forEach(r => ws.addRow(r));
  }

  // Hoja 3: Más Consumidos
  {
    const ws = workbook.addWorksheet('Más Consumidos');
    ws.columns = [
      { header: 'Artículo',          key: 'nombre',   width: 35 },
      { header: 'Cantidad',          key: 'cantidad',  width: 15 },
      { header: 'Valor Total (Gs.)', key: 'total_gs',  width: 20 },
    ];
    estilizarEncabezados(ws, ws.columns);
    masConsumidosData.forEach(r => ws.addRow(r));
  }

  // Hoja 4: Valor Total
  {
    const ws = workbook.addWorksheet('Valor Total');
    ws.columns = [
      { header: 'Concepto',      key: 'concepto', width: 35 },
      { header: 'Monto (Gs.)',   key: 'monto',    width: 25 },
    ];
    estilizarEncabezados(ws, ws.columns);
    ws.addRow({ concepto: 'Total consumido en el período', monto: valorTotalData.total_gs });
  }

  // Hoja 5: Proyección de Stock
  {
    const ws = workbook.addWorksheet('Proyección de Stock');
    ws.columns = [
      { header: 'Artículo',       key: 'nombre',         width: 35 },
      { header: 'Stock Actual',   key: 'stock_actual',   width: 15 },
      { header: 'Stock Mínimo',   key: 'stock_minimo',   width: 15 },
      { header: 'Consumo Diario', key: 'consumo_diario', width: 18 },
      { header: 'Días Restantes', key: 'dias_restantes', width: 18 },
      { header: 'Estado',         key: 'estado',         width: 12 },
    ];
    estilizarEncabezados(ws, ws.columns);
    proyeccion.forEach(r => ws.addRow({ ...r, dias_restantes: r.dias_restantes ?? 'Sin datos' }));
  }

  return workbook;
}

module.exports = {
  consumoPorPeriodo,
  consumoPorDepartamento,
  masConsumidos,
  valorTotal,
  proyeccionStock,
  generarExcel,
};
