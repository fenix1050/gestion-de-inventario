// =============================================================
// backend/src/routes/ingresos.routes.js
// Rutas para el recurso Ingresos
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/ingresos.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRol } = require('../middlewares/roles.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { ingresoCreateSchema, ingresoUpdateSchema } = require('../models/ingreso.model');

const router = Router();

router.post('/',    requireAuth, requireRol('operador', 'admin'), validate(ingresoCreateSchema), ctrl.crear);
router.get('/',     requireAuth, ctrl.listar);
router.patch('/:id', requireAuth, requireRol('operador', 'admin'), validate(ingresoUpdateSchema), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRol('operador', 'admin'), ctrl.eliminar);

module.exports = router;
