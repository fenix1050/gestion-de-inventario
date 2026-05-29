// =============================================================
// backend/src/middlewares/errorHandler.js
// Middleware de error global — debe registrarse ÚLTIMO en server.js
// Mapea errores de dominio tipados a status HTTP apropiados.
// Todos los errores no capturados por los controllers llegan acá.
// =============================================================

const { badRequest, serverError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

// Códigos de dominio que se mapean a 400 Bad Request.
// Agregar nuevos códigos acá a medida que se definen en los services.
const DOMAIN_400_CODES = new Set([
  'STOCK_INSUFICIENTE',
  'DEPARTAMENTO_NO_ENCONTRADO',
  'NOT_FOUND',
  'DUPLICATE_CODE',
]);

/**
 * Express error handler de 4 parámetros.
 * Cualquier llamada a next(err) termina acá.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Errores de dominio con código conocido → 400 (no loguear como error, es flujo normal)
  if (err.code && DOMAIN_400_CODES.has(err.code)) {
    return badRequest(res, err.message);
  }

  // Error inesperado → loguear y responder 500
  logger.error(err.message || err);
  return serverError(res, err.message || 'Error interno del servidor.');
};

module.exports = { errorHandler };
