const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const supabase = require('../../config/supabase');

const router = Router();

// GET /api/auth/me — devuelve el usuario autenticado enriquecido con datos de la tabla usuarios
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol, departamento_id, activo')
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
      id:              req.user.id,
      email:           req.user.email,
      nombre:          data.nombre ?? null,
      rol:             data.rol,
      departamento_id: data.departamento_id,
    },
  });
});

// POST /api/auth/change-password — cambia la contraseña del usuario autenticado
router.post('/change-password', requireAuth, async (req, res) => {
  const { nuevaPassword } = req.body;

  if (!nuevaPassword || nuevaPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: nuevaPassword });

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
});

module.exports = router;
