// =============================================================
// backend/src/services/ingresos.service.js
// Lógica de negocio y queries a Supabase para ingresos al depósito.
// El trigger trigger_ingreso_stock actualiza stock_actual automáticamente
// después del INSERT — nunca escribir stock_actual desde acá.
// =============================================================

const supabase = require('../../config/supabase');
const { createDomainError } = require('../utils/responseHelper');

/**
 * Registra un ingreso de mercancía al depósito.
 * El trigger de Postgres incrementa stock_actual síncronamente dentro
 * de la misma transacción, por lo que el SELECT posterior ya refleja
 * el stock actualizado.
 *
 * @param {Object} payload - campos validados por ingresoCreateSchema
 * @returns {{ ingreso: Object, stock_actual: number }}
 */
const crearIngreso = async (payload) => {
  const { data: ingreso, error } = await supabase
    .from('ingresos')
    .insert(payload)
    .select('id, fecha, cantidad, precio_unitario, referencia, proveedor_nombre, articulo_id, proveedor_id, observaciones')
    .single();

  if (error) throw new Error(error.message);

  const { data: articulo, error: errorStock } = await supabase
    .from('articulos')
    .select('stock_actual')
    .eq('id', payload.articulo_id)
    .single();

  if (errorStock) throw new Error(errorStock.message);

  return { ingreso, stock_actual: articulo.stock_actual };
};

/**
 * Lista ingresos con filtros opcionales y paginación.
 *
 * @param {Object} filtros
 * @param {string} [filtros.articulo_id]
 * @param {string} [filtros.proveedor_id]
 * @param {string} [filtros.desde] - ISO date string
 * @param {string} [filtros.hasta] - ISO date string
 * @param {number} [filtros.limit=20]
 * @param {number} [filtros.offset=0]
 */
const getIngresos = async ({ articulo_id, proveedor_id, desde, hasta, limit = 20, offset = 0 } = {}) => {
  let query = supabase
    .from('ingresos')
    .select('id, fecha, cantidad, precio_unitario, referencia, proveedor_nombre, observaciones, articulo:articulos(id, codigo, nombre)')
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1);

  if (articulo_id)  query = query.eq('articulo_id', articulo_id);
  if (proveedor_id) query = query.eq('proveedor_id', proveedor_id);
  if (desde)        query = query.gte('fecha', desde);
  if (hasta)        query = query.lte('fecha', hasta);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
};

const actualizarIngreso = async (id, payload) => {
  const { data: prev, error: errPrev } = await supabase
    .from('ingresos').select('articulo_id').eq('id', id).single();
  if (errPrev) throw new Error(errPrev.message);

  const { data, error } = await supabase
    .from('ingresos')
    .update(payload)
    .eq('id', id)
    .select('id, fecha, cantidad, precio_unitario, referencia, proveedor_nombre, observaciones')
    .single();

  if (error) throw new Error(error.message);

  const { data: articulo } = await supabase
    .from('articulos').select('stock_actual').eq('id', prev.articulo_id).single();

  return { ingreso: data, stock_actual: articulo?.stock_actual ?? null };
};

const eliminarIngreso = async (id) => {
  const { data: prev, error: errPrev } = await supabase
    .from('ingresos').select('articulo_id').eq('id', id).single();
  if (errPrev) throw new Error(errPrev.message);

  const { error } = await supabase.from('ingresos').delete().eq('id', id);
  if (error) throw new Error(error.message);

  const { data: articulo } = await supabase
    .from('articulos').select('stock_actual').eq('id', prev.articulo_id).single();

  return { stock_actual: articulo?.stock_actual ?? null };
};

module.exports = { crearIngreso, getIngresos, actualizarIngreso, eliminarIngreso };
