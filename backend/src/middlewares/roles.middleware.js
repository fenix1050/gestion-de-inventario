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
      if (!req.user || !req.user.sub) {
        return unauthorized(res, 'No se pudo identificar al usuario. Iniciá sesión de nuevo.');
      }

      // En el JWT de Supabase no viene el rol que definimos en la tabla `usuarios`.
      // Podríamos haber metido el rol en user_metadata, pero acá consultamos nuestra
      // tabla `usuarios` para asegurarnos de tener el rol actual.
      // Como esto se ejecuta en cada request protegida por rol, y usamos la
      // service_role, podemos consultar rápido.
      
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', req.user.sub)
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
