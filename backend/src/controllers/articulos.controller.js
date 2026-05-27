// =============================================================
// backend/src/controllers/articulos.controller.js
// Controlador para el recurso Artículos
// =============================================================

const articulosService = require('../services/articulos.service');
const { ok, serverError } = require('../utils/responseHelper');
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

module.exports = {
  getList,
};
