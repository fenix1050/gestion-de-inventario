const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const supabase = require('../../config/supabase');

const router = Router();

// GET /api/auth/me — devuelve el usuario autenticado enriquecido con datos de la tabla usuarios
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, rol, departamento_id, activo')
    .eq('id', req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, error: 'Error al obtener perfil del usuario.' });
  }

  if (!data) {
    return res.status(403).json({ success: false, error: 'Usuario no registrado en el sistema.' });
  }

  if (!data.activo) {
    return res.status(403).json({ success: false, error: 'Tu cuenta está desactivada. Contactá al administrador.' });
  }

  return res.json({
    success: true,
    data: {
      id:             req.user.id,
      email:          req.user.email,
      rol:            data.rol,
      departamento_id: data.departamento_id,
    },
  });
});

module.exports = router;
