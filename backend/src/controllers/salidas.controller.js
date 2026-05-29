// =============================================================
// backend/src/controllers/salidas.controller.js
// Controlador para el recurso Salidas
// =============================================================

const salidasService = require('../services/salidas.service');
const { ok, created } = require('../utils/responseHelper');

/**
 * POST /api/salidas
 * Registra una salida del depósito. Devuelve la salida creada
 * y el stock_actual actualizado por el trigger de Postgres.
 */
const crear = async (req, res, next) => {
  try {
    const data = await salidasService.crearSalida(req.body, req.user.id);
    return created(res, data, 'Salida registrada correctamente.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/salidas
 * Lista salidas con filtros opcionales por query string.
 */
const listar = async (req, res, next) => {
  try {
    const { page, limit, articulo_id, departamento_id, fecha_desde, fecha_hasta } = req.query;
    const data = await salidasService.getSalidas({
      page:            page            ? parseInt(page,            10) : 1,
      limit:           limit           ? parseInt(limit,           10) : 20,
      articulo_id,
      departamento_id,
      fecha_desde,
      fecha_hasta,
    });
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/salidas/:id
const actualizar = async (req, res, next) => {
  try {
    const data = await salidasService.actualizarSalida(req.params.id, req.body);
    return ok(res, data, 'Salida actualizada correctamente.');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/salidas/:id
const eliminar = async (req, res, next) => {
  try {
    const data = await salidasService.eliminarSalida(req.params.id);
    return ok(res, data, 'Salida eliminada y stock recalculado.');
  } catch (err) {
    next(err);
  }
};

module.exports = { crear, listar, actualizar, eliminar };
