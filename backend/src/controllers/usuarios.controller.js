// =============================================================
// backend/src/controllers/usuarios.controller.js
// Controlador para el recurso Usuarios
// =============================================================

const usuariosService = require('../services/usuarios.service');
const { ok, created, badRequest, notFound } = require('../utils/responseHelper');

/**
 * GET /api/usuarios
 * Lista usuarios. Todos los roles autenticados pueden listar.
 * Acepta ?activo=true|false — si se omite, devuelve todos.
 */
const listar = async (req, res, next) => {
  try {
    // filtroActivo: true → solo activos, false → solo inactivos, null → todos
    let filtroActivo = null;
    if (req.query.activo === 'true')  filtroActivo = true;
    if (req.query.activo === 'false') filtroActivo = false;

    const data = await usuariosService.getUsuarios({ filtroActivo });
    return ok(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/usuarios
 * Crea un nuevo usuario. Solo admin.
 */
const crear = async (req, res, next) => {
  try {
    const data = await usuariosService.crearUsuario(req.body);
    return created(res, data, 'Usuario creado exitosamente.');
  } catch (err) {
    // Mapear domain errors a status HTTP específicos
    if (err.code === 'EMAIL_DUPLICADO') {
      return res.status(409).json({ success: false, error: err.message });
    }
    if (err.code === 'PASSWORD_DEBIL') {
      return badRequest(res, err.message);
    }
    next(err);
  }
};

/**
 * PUT /api/usuarios/:id
 * Actualiza datos de un usuario (nombre, rol, departamento, activo).
 * Email y password no se modifican desde este endpoint.
 * Solo admin.
 */
const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await usuariosService.actualizarUsuario(id, req.body);

    if (!data) {
      return notFound(res, 'Usuario no encontrado.');
    }

    return ok(res, data, 'Usuario actualizado.');
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

/**
 * DELETE /api/usuarios/:id
 * Desactiva (soft-delete) un usuario. Solo admin.
 * Guard: un admin no puede desactivarse a sí mismo.
 */
const desactivar = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Guard no-self-lock
    if (req.user.id === id) {
      return badRequest(res, 'No podés desactivar tu propia cuenta.');
    }

    await usuariosService.desactivarUsuario(id);
    return ok(res, null, 'Usuario desactivado.');
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, crear, actualizar, desactivar };
