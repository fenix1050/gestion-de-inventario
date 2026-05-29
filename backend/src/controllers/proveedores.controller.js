// =============================================================
// backend/src/controllers/proveedores.controller.js
// Controlador para el recurso Proveedores
// =============================================================

const proveedoresService = require('../services/proveedores.service');
const { ok } = require('../utils/responseHelper');

/**
 * GET /api/proveedores
 * Lista los proveedores activos (para selects en formularios).
 */
const listar = async (req, res, next) => {
  try {
    const data = await proveedoresService.getProveedores();
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { listar };
