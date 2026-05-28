// =============================================================
// backend/src/middlewares/roles.middleware.js
// Middleware para verificar que el usuario tenga un rol específico
// =============================================================

const { forbidden, unauthorized } = require('../utils/responseHelper');
const supabase = require('../../config/supabase');

/**
 * Middleware que verifica si el usuario actual (req.user) tiene alguno
 * de los roles permitidos. Requiere que auth.middleware se ejecute antes.
 * @param {...string} rolesPermitidos - Lista de roles (ej: 'admin', 'operador')
 */
const requireRol = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      // supabase.auth.getUser() devuelve el usuario con campo `id`, no `sub`
      const userId = req.user.id;
      if (!req.user || !userId) {
        return unauthorized(res, 'No se pudo identificar al usuario. Iniciá sesión de nuevo.');
      }

      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single();

      if (error || !usuario) {
        return forbidden(res, 'No se encontró tu perfil de usuario en el sistema.');
      }

      // Guardamos el rol en el req para que los controllers no tengan que buscarlo de nuevo
      req.user.rol = usuario.rol;

      if (!rolesPermitidos.includes(usuario.rol)) {
        return forbidden(res, 'No tenés permisos para realizar esta acción.');
      }

      next();
    } catch (err) {
      return forbidden(res, 'Error al verificar los permisos del usuario.');
    }
  };
};

module.exports = { requireRol };
