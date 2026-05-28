// =============================================================
// backend/src/controllers/articulos.controller.js
// Controlador para el recurso Artículos
// =============================================================

const articulosService = require('../services/articulos.service');
const { ok, created, badRequest, notFound, serverError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * GET /api/articulos
 * Obtiene el listado de artículos (con filtros opcionales por query)
 */
const getList = async (req, res) => {
  try {
    const { categoria, search, inactivos } = req.query;

    // Por defecto traemos solo los activos, a menos que se pidan los inactivos
    const soloActivos = inactivos !== 'true';

    const articulos = await articulosService.getArticulos({
      categoria,
      search,
      soloActivos
    });

    return ok(res, articulos);
  } catch (err) {
    logger.error('Error en getList (articulos.controller):', err);
    return serverError(res, 'Error al obtener la lista de artículos.');
  }
};

/**
 * GET /api/articulos/:id
 * Obtiene un artículo por ID (solo activos)
 */
const getById = async (req, res) => {
  try {
    const articulo = await articulosService.getArticuloById(req.params.id);
    return ok(res, articulo);
  } catch (e) {
    if (e.code === 'NOT_FOUND') return notFound(res, e.message);
    logger.error('Error en getById (articulos.controller):', e);
    return serverError(res, e.message);
  }
};

/**
 * POST /api/articulos
 * Crea un nuevo artículo (solo admin)
 */
const create = async (req, res) => {
  try {
    const creado = await articulosService.crearArticulo(req.body, req.user.id);
    return created(res, creado, 'Artículo creado correctamente.');
  } catch (e) {
    if (e.code === 'DUPLICATE_CODE') return badRequest(res, e.message);
    logger.error('Error en create (articulos.controller):', e);
    return serverError(res, e.message);
  }
};

/**
 * PUT /api/articulos/:id
 * Actualiza un artículo existente (solo admin)
 */
const update = async (req, res) => {
  try {
    const actualizado = await articulosService.actualizarArticulo(req.params.id, req.body);
    return ok(res, actualizado, 'Artículo actualizado correctamente.');
  } catch (e) {
    if (e.code === 'NOT_FOUND') return notFound(res, e.message);
    if (e.code === 'DUPLICATE_CODE') return badRequest(res, e.message);
    logger.error('Error en update (articulos.controller):', e);
    return serverError(res, e.message);
  }
};

/**
 * DELETE /api/articulos/:id
 * Desactiva un artículo (soft delete, solo admin)
 */
const softDelete = async (req, res) => {
  try {
    const desactivado = await articulosService.desactivarArticulo(req.params.id);
    return ok(res, desactivado, 'Artículo desactivado correctamente.');
  } catch (e) {
    if (e.code === 'NOT_FOUND') return notFound(res, e.message);
    logger.error('Error en softDelete (articulos.controller):', e);
    return serverError(res, e.message);
  }
};

/**
 * GET /api/articulos/siguiente-codigo
 * Devuelve el siguiente código ART-XXX libre (incluye artículos inactivos)
 */
const getSiguienteCodigo = async (req, res) => {
  try {
    const codigo = await articulosService.getSiguienteCodigo();
    return ok(res, { codigo });
  } catch (e) {
    logger.error('Error en getSiguienteCodigo:', e);
    return serverError(res, 'Error al calcular el siguiente código.');
  }
};

module.exports = {
  getList,
  getById,
  getSiguienteCodigo,
  create,
  update,
  softDelete,
};
