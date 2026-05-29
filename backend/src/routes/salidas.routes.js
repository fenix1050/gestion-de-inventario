// =============================================================
// backend/src/routes/salidas.routes.js
// Rutas para el recurso Salidas
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/salidas.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRol } = require('../middlewares/roles.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { salidaCreateSchema, salidaUpdateSchema } = require('../models/salida.model');

const router = Router();

router.post('/',      requireAuth, requireRol('operador', 'admin'), validate(salidaCreateSchema), ctrl.crear);
router.get('/',       requireAuth, ctrl.listar);
router.patch('/:id',  requireAuth, requireRol('operador', 'admin'), validate(salidaUpdateSchema), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRol('operador', 'admin'), ctrl.eliminar);

module.exports = router;
