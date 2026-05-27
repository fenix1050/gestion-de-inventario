// =============================================================
// backend/src/services/articulos.service.js
// Lógica de negocio y queries a Supabase para artículos
// =============================================================

const supabase = require('../../config/supabase');

// Columnas explícitas — nunca SELECT * (regla del proyecto)
const COLUMNS = 'id, codigo, nombre, categoria, precio_unitario, stock_actual, stock_minimo, unidad_medida, activo, created_at, updated_at';

/**
 * Crea un error de dominio tipado.
 * El controller lo detecta por e.code para decidir el status HTTP.
 * @param {string} code - identificador de dominio (NOT_FOUND, DUPLICATE_CODE, etc.)
 * @param {string} message - mensaje en español para el cliente
 */
const domainError = (code, message) => {
  const e = new Error(message);
  e.code = code;
  return e;
};

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

/**
 * Obtener un artículo por ID (solo activos)
 * @param {string} id - UUID del artículo
 */
const getArticuloById = async (id) => {
  const { data, error } = await supabase
    .from('articulos')
    .select(COLUMNS)
    .eq('id', id)
    .eq('activo', true)
    .maybeSingle(); // retorna null si no existe, no lanza error

  if (error) throw new Error(error.message);
  if (!data) throw domainError('NOT_FOUND', 'Artículo no encontrado.');
  return data;
};

/**
 * Crear un nuevo artículo.
 * Normaliza codigo a UPPERCASE antes de persistir.
 * @param {Object} data - campos del artículo (validados por Zod)
 */
const crearArticulo = async (data) => {
  // Normalización de código: el negocio espera ABC123 == abc123 (mismo artículo)
  const payload = { ...data, codigo: data.codigo.toUpperCase() };

  const { data: creado, error } = await supabase
    .from('articulos')
    .insert(payload)
    .select(COLUMNS)
    .single();

  if (error) {
    // 23505 = unique_violation en PostgreSQL
    if (error.code === '23505') {
      throw domainError('DUPLICATE_CODE', 'Ya existe un artículo con ese código.');
    }
    throw new Error(error.message);
  }

  return creado;
};

/**
 * Actualizar un artículo existente (solo activos).
 * Permite actualización parcial (solo los campos enviados).
 * @param {string} id - UUID del artículo
 * @param {Object} data - campos a actualizar (validados por Zod .partial())
 */
const actualizarArticulo = async (id, data) => {
  const payload = { ...data };
  // Normalizar código si viene en el payload
  if (payload.codigo) payload.codigo = payload.codigo.toUpperCase();

  const { data: actualizado, error } = await supabase
    .from('articulos')
    .update(payload)
    .eq('id', id)
    .eq('activo', true) // no se puede editar un artículo inactivo
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      throw domainError('DUPLICATE_CODE', 'Ya existe un artículo con ese código.');
    }
    throw new Error(error.message);
  }

  if (!actualizado) throw domainError('NOT_FOUND', 'Artículo no encontrado.');
  return actualizado;
};

/**
 * Desactivar un artículo (soft delete).
 * Solo desactiva si estaba activo — idempotencia explícita.
 * @param {string} id - UUID del artículo
 */
const desactivarArticulo = async (id) => {
  const { data, error } = await supabase
    .from('articulos')
    .update({ activo: false })
    .eq('id', id)
    .eq('activo', true) // si ya estaba inactivo, retorna null → NOT_FOUND
    .select('id, codigo, activo')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw domainError('NOT_FOUND', 'Artículo no encontrado.');
  return data;
};

module.exports = {
  getArticulos,
  getArticuloById,
  crearArticulo,
  actualizarArticulo,
  desactivarArticulo,
};
