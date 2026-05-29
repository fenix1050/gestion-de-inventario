// =============================================================
// backend/src/routes/usuarios.routes.js
// Rutas para el recurso Usuarios
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/usuarios.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRol } = require('../middlewares/roles.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { crearUsuarioSchema, actualizarUsuarioSchema } = require('../models/usuario.model');

const router = Router();

// Lectura: cualquier usuario autenticado
router.get('/', requireAuth, ctrl.listar);

// Escritura: solo admin
router.post('/',    requireAuth, requireRol('admin'), validate(crearUsuarioSchema),    ctrl.crear);
router.put('/:id',  requireAuth, requireRol('admin'), validate(actualizarUsuarioSchema), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRol('admin'), ctrl.desactivar);

module.exports = router;
