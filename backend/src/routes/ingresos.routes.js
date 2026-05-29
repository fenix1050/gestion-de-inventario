// =============================================================
// backend/src/routes/ingresos.routes.js
// Rutas para el recurso Ingresos
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/ingresos.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRol } = require('../middlewares/roles.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { ingresoCreateSchema } = require('../models/ingreso.model');

const router = Router();

// Escritura: solo operador y admin
router.post('/', requireAuth, requireRol('operador', 'admin'), validate(ingresoCreateSchema), ctrl.crear);

// Lectura: cualquier usuario autenticado
router.get('/', requireAuth, ctrl.listar);

module.exports = router;
