// =============================================================
// backend/src/controllers/historial.controller.js
// Controlador para GET /api/historial
// =============================================================

const historialService = require('../services/historial.service');
const { ok } = require('../utils/responseHelper');

/**
 * GET /api/historial
 * Devuelve una página del historial unificado de movimientos.
 * Soporta filtros opcionales: page, limit, tipo, articulo_id, fecha_desde, fecha_hasta.
 */
const listar = async (req, res, next) => {
  try {
    const { page, limit, tipo, articulo_id, fecha_desde, fecha_hasta } = req.query;

    const data = await historialService.getHistorial({
      page:        page        ? parseInt(page,  10) : 1,
      limit:       limit       ? Math.min(parseInt(limit, 10), 100) : 20,
      tipo,
      articulo_id,
      fecha_desde,
      fecha_hasta,
    });

    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { listar };
