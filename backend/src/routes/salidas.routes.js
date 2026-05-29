// =============================================================
// backend/src/routes/salidas.routes.js
// Rutas para el recurso Salidas
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/salidas.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRol } = require('../middlewares/roles.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { salidaCreateSchema } = require('../models/salida.model');

const router = Router();

// Escritura: solo operador y admin
router.post('/', requireAuth, requireRol('operador', 'admin'), validate(salidaCreateSchema), ctrl.crear);

// Lectura: cualquier usuario autenticado
router.get('/', requireAuth, ctrl.listar);

module.exports = router;
