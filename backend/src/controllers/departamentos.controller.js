// =============================================================
// backend/src/controllers/departamentos.controller.js
// Controlador para el recurso Departamentos
// =============================================================

const departamentosService = require('../services/departamentos.service');
const { ok } = require('../utils/responseHelper');

/**
 * GET /api/departamentos
 * Lista todos los departamentos (para selects en formularios).
 */
const listar = async (req, res, next) => {
  try {
    const data = await departamentosService.getDepartamentos();
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { listar };
