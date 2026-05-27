// =============================================================
// backend/src/services/articulos.service.js
// Lógica de negocio y queries a Supabase para artículos
// =============================================================

const supabase = require('../../config/supabase');

/**
 * Obtener listado de artículos con filtros opcionales
 * @param {Object} filtros
 * @param {string} [filtros.categoria]
 * @param {string} [filtros.search]
 * @param {boolean} [filtros.soloActivos=true]
 */
const getArticulos = async ({ categoria, search, soloActivos = true } = {}) => {
  let query = supabase
    .from('articulos')
    .select('id, codigo, nombre, categoria, precio_unitario, stock_actual, stock_minimo, unidad_medida, activo')
    .order('nombre');

  if (soloActivos) {
    query = query.eq('activo', true);
  }

  if (categoria) {
    query = query.eq('categoria', categoria);
  }

  if (search) {
    // Búsqueda por nombre o código usando ilike (case-insensitive)
    query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error al obtener artículos: ${error.message}`);
  }

  return data;
};

module.exports = {
  getArticulos,
};
