// =============================================================
// backend/src/controllers/ingresos.controller.js
// Controlador para el recurso Ingresos
// =============================================================

const ingresosService = require('../services/ingresos.service');
const { ok, created } = require('../utils/responseHelper');

/**
 * POST /api/ingresos
 * Registra un ingreso al depósito. Devuelve el ingreso creado
 * y el stock_actual actualizado por el trigger de Postgres.
 */
const crear = async (req, res, next) => {
  try {
    const data = await ingresosService.crearIngreso(req.body);
    return created(res, data, 'Ingreso registrado correctamente.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ingresos
 * Lista ingresos con filtros opcionales por query string.
 */
const listar = async (req, res, next) => {
  try {
    const { articulo_id, proveedor_id, desde, hasta, limit, offset } = req.query;
    const data = await ingresosService.getIngresos({
      articulo_id,
      proveedor_id,
      desde,
      hasta,
      limit:  limit  ? parseInt(limit,  10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { crear, listar };
