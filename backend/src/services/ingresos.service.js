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
    .select('id, fecha, cantidad, precio_unitario, numero_factura, articulo_id, proveedor_id, observaciones')
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
    .select('id, fecha, cantidad, precio_unitario, numero_factura, observaciones, articulo:articulos(id, codigo, nombre), proveedor:proveedores(id, nombre)')
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

module.exports = { crearIngreso, getIngresos };
