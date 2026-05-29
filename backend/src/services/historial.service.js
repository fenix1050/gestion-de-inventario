// =============================================================
// backend/src/services/historial.service.js
// Lógica de negocio para el historial unificado de movimientos.
// Consulta la vista historial_movimientos definida en 001_initial_schema.sql.
// =============================================================

const supabase = require('../../config/supabase');

/**
 * Devuelve una página del historial unificado de movimientos.
 *
 * Columnas seleccionadas (exactamente las de la vista historial_movimientos):
 *   id, tipo, fecha, articulo_codigo, articulo_nombre, articulo_categoria,
 *   cantidad, precio_unitario, total_gs, proveedor_nombre,
 *   departamento_id, departamento_nombre, centro_costo,
 *   motivo, referencia, observaciones, registrado_por, created_at
 *
 * @param {Object} filtros
 * @param {number} [filtros.page=1]
 * @param {number} [filtros.limit=20]
 * @param {'ingreso'|'salida'} [filtros.tipo]
 * @param {string}  [filtros.articulo_id]   - uuid; filtra por articulo_codigo/nombre no disponible directo; no aplica aquí
 * @param {string}  [filtros.fecha_desde]   - ISO date string
 * @param {string}  [filtros.fecha_hasta]   - ISO date string
 */
const getHistorial = async ({ page = 1, limit = 20, tipo, articulo_id, fecha_desde, fecha_hasta } = {}) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('historial_movimientos')
    .select(
      'id, tipo, fecha, articulo_codigo, articulo_nombre, articulo_categoria, ' +
      'cantidad, precio_unitario, total_gs, proveedor_nombre, ' +
      'departamento_id, departamento_nombre, centro_costo, ' +
      'motivo, referencia, observaciones, registrado_por, created_at'
    )
    .order('fecha',      { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (tipo)         query = query.eq('tipo',       tipo);
  // La vista no expone articulo_id directamente; el filtro no aplica a nivel de vista.
  // Si se requiere filtrar por articulo_id en una versión futura, se debe agregar
  // la columna a la vista. Por ahora se ignora silenciosamente.
  if (fecha_desde)  query = query.gte('fecha', fecha_desde);
  if (fecha_hasta)  query = query.lte('fecha', fecha_hasta);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { getHistorial };
