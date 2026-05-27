// =============================================================
// backend/src/middlewares/auth.middleware.js
// Middleware para validar el JWT de Supabase
// =============================================================

// Usamos supabase.auth.getUser() en lugar de jwt.verify() porque Supabase
// migró a JWT Signing Keys con algoritmo ES256 (asimétrico). jwt.verify()
// con un string secret solo soporta HS256 y falla con "invalid algorithm".
const supabase = require('../../config/supabase');
const { unauthorized } = require('../utils/responseHelper');

/**
 * Middleware que verifica que la petición traiga un JWT válido de Supabase
 * y lo decodifica en req.user para que el siguiente middleware o controller lo use.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No se proporcionó un token de autenticación.');
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    const logger = require('../utils/logger');
    logger.error('Error al verificar token con Supabase:', error?.message);
    return unauthorized(res, 'Token inválido o expirado. Por favor iniciá sesión nuevamente.');
  }

  // data.user trae id, email, user_metadata, app_metadata, etc.
  req.user = data.user;

  next();
};

module.exports = { requireAuth };
