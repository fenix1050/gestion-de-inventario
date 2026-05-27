// =============================================================
// backend/src/utils/responseHelper.js
// Funciones para respuestas HTTP consistentes.
// Todos los controllers usan estas funciones — nunca res.json() directo.
//
// Formato de éxito:  { success: true,  data,  message? }
// Formato de error:  { success: false, error }
// =============================================================

/**
 * Respuesta exitosa (200 por defecto)
 * @param {import('express').Response} res
 * @param {*} data - datos a devolver
 * @param {string} [message] - mensaje opcional
 * @param {number} [status=200]
 */
const ok = (res, data, message = null, status = 200) => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
};

/**
 * Respuesta de recurso creado (201)
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message]
 */
const created = (res, data, message = 'Registro creado correctamente.') => {
  return ok(res, data, message, 201);
};

/**
 * Respuesta de error con status HTTP explícito
 * @param {import('express').Response} res
 * @param {string} error - mensaje de error en español
 * @param {number} [status=500]
 */
const error = (res, mensajeError, status = 500) => {
  return res.status(status).json({ success: false, error: mensajeError });
};

/**
 * Atajos semánticos para los errores más comunes
 */
const badRequest  = (res, msg)  => error(res, msg, 400);  // validación fallida
const unauthorized= (res, msg)  => error(res, msg || 'No autenticado.', 401);
const forbidden   = (res, msg)  => error(res, msg || 'No tenés permisos para realizar esta acción.', 403);
const notFound    = (res, msg)  => error(res, msg || 'Recurso no encontrado.', 404);
const serverError = (res, msg)  => error(res, msg || 'Error interno del servidor.', 500);

module.exports = { ok, created, error, badRequest, unauthorized, forbidden, notFound, serverError };
