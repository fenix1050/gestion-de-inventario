// =============================================================
// backend/src/services/salidas.service.js
// Lógica de negocio y queries a Supabase para salidas del depósito.
//
// El trigger trigger_salida_stock valida el stock y decrementa stock_actual
// síncronamente. Si el stock es insuficiente lanza RAISE EXCEPTION con
// SQLSTATE P0001, que Supabase JS expone en error.code.
//
// El centro_costo se copia como snapshot del departamento al momento del INSERT
// para preservar la trazabilidad contable histórica.
// =============================================================

const supabase = require('../../config/supabase');
const { createDomainError } = require('../utils/responseHelper');

/**
 * Registra una salida de insumo del depósito.
 *
 * 1. Obtiene el departamento para copiar centro_costo (snapshot inmutable).
 * 2. Inserta en salidas con centro_costo copiado.
 * 3. Si el trigger lanza P0001 → STOCK_INSUFICIENTE.
 * 4. SELECT stock_actual post-INSERT para incluirlo en la respuesta.
 *
 * @param {Object} payload - campos validados por salidaCreateSchema
 * @param {string} userId  - ID del usuario que registra (req.user.id)
 * @returns {{ salida: Object, stock_actual: number }}
 */
const crearSalida = async (payload, userId) => {
  // Paso 1: resolver centro_costo del departamento (snapshot)
  const { data: depto, error: errorDepto } = await supabase
    .from('departamentos')
    .select('id, centro_costo')
    .eq('id', payload.departamento_id)
    .single();

  if (errorDepto || !depto) {
    throw createDomainError('DEPARTAMENTO_NO_ENCONTRADO', 'El departamento especificado no existe.');
  }

  // Paso 2: INSERT en salidas con registrado_por y centro_costo
  const { data: salida, error } = await supabase
    .from('salidas')
    .insert({
      articulo_id:     payload.articulo_id,
      cantidad:        payload.cantidad,
      departamento_id: payload.departamento_id,
      colaborador_id:  payload.colaborador_id,
      observaciones:   payload.observaciones,
      centro_costo:    depto.centro_costo,
      usuario_id:      userId,
    })
    .select('id, fecha, cantidad, articulo_id, departamento_id, colaborador_id, centro_costo, observaciones')
    .single();

  // Paso 3: capturar error P0001 del trigger (stock insuficiente)
  if (error) {
    if (error.code === 'P0001') {
      throw createDomainError('STOCK_INSUFICIENTE', 'Stock insuficiente para completar la salida.');
    }
    throw new Error(error.message);
  }

  // Paso 4: SELECT stock_actual actualizado por el trigger
  const { data: articulo, error: errorStock } = await supabase
    .from('articulos')
    .select('stock_actual')
    .eq('id', payload.articulo_id)
    .single();

  if (errorStock) throw new Error(errorStock.message);

  return { salida, stock_actual: articulo.stock_actual };
};

/**
 * Lista salidas con filtros opcionales y paginación.
 *
 * @param {Object} filtros
 * @param {number} [filtros.page=1]
 * @param {number} [filtros.limit=20]
 * @param {string} [filtros.articulo_id]
 * @param {string} [filtros.departamento_id]
 * @param {string} [filtros.fecha_desde] - ISO date string
 * @param {string} [filtros.fecha_hasta] - ISO date string
 */
const getSalidas = async ({ page = 1, limit = 20, articulo_id, departamento_id, fecha_desde, fecha_hasta } = {}) => {
  const offset = (page - 1) * limit;

  let query = supabase
    .from('salidas')
    .select(
      'id, fecha, cantidad, observaciones, centro_costo, colaborador_id, usuario_id, ' +
      'articulo:articulos(id, codigo, nombre), ' +
      'departamento:departamentos(id, nombre)'
    )
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1);

  if (articulo_id)     query = query.eq('articulo_id', articulo_id);
  if (departamento_id) query = query.eq('departamento_id', departamento_id);
  if (fecha_desde)     query = query.gte('fecha', fecha_desde);
  if (fecha_hasta)     query = query.lte('fecha', fecha_hasta);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { crearSalida, getSalidas };
