// =============================================================
// backend/src/services/articulos.service.js
// Lógica de negocio y queries a Supabase para artículos
// =============================================================

const supabase = require('../../config/supabase');

// Columnas explícitas — nunca SELECT * (regla del proyecto)
const COLUMNS = 'id, codigo, nombre, descripcion, categoria, precio_unitario, stock_actual, stock_minimo, unidad_medida, activo, created_at, updated_at';

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
 * Si stock_inicial > 0, registra un ingreso para que el trigger de Postgres
 * actualice stock_actual — nunca se escribe stock_actual directo.
 * @param {Object} data - campos validados por Zod (puede incluir stock_inicial)
 * @param {string} usuarioId - UUID del usuario autenticado (requerido para el ingreso)
 */
const crearArticulo = async (data, usuarioId) => {
  // Extraer stock_inicial antes de insertar en articulos (no es columna de esa tabla)
  const { stock_inicial = 0, ...camposArticulo } = data;

  const payload = { ...camposArticulo, codigo: camposArticulo.codigo.toUpperCase() };

  const { data: creado, error } = await supabase
    .from('articulos')
    .insert(payload)
    .select(COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw domainError('DUPLICATE_CODE', 'Ya existe un artículo con ese código.');
    }
    throw new Error(error.message);
  }

  // Registrar ingreso inicial si corresponde → el trigger suma al stock_actual
  if (stock_inicial > 0) {
    const { error: errorIngreso } = await supabase
      .from('ingresos')
      .insert({
        articulo_id:     creado.id,
        cantidad:        stock_inicial,
        precio_unitario: creado.precio_unitario,
        usuario_id:      usuarioId,
        referencia:      'Stock inicial',
      });

    if (errorIngreso) throw new Error(`Artículo creado, pero falló el ingreso inicial: ${errorIngreso.message}`);

    // Refrescar el artículo para devolver el stock_actual ya actualizado por el trigger
    const { data: actualizado, error: errorRefresh } = await supabase
      .from('articulos')
      .select(COLUMNS)
      .eq('id', creado.id)
      .single();

    if (errorRefresh) return creado; // el trigger ya corrió, devolver lo que tenemos
    return actualizado;
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
  // Extraer stock_inicial por si llega en el body — no es columna de articulos
  const { stock_inicial, ...payload } = data;
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

/**
 * Calcula el siguiente código ART-XXX libre considerando todos los artículos
 * (activos e inactivos) para evitar duplicados tras soft-delete.
 */
const getSiguienteCodigo = async () => {
  const { data, error } = await supabase
    .from('articulos')
    .select('codigo');

  if (error) throw new Error(error.message);

  const nums = (data || [])
    .map(a => {
      const m = a.codigo?.match(/^ART-(\d+)$/i);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => n > 0);

  const siguiente = nums.length ? Math.max(...nums) + 1 : 1;
  return `ART-${String(siguiente).padStart(3, '0')}`;
};

module.exports = {
  getArticulos,
  getArticuloById,
  getSiguienteCodigo,
  crearArticulo,
  actualizarArticulo,
  desactivarArticulo,
};
