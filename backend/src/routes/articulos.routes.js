// =============================================================
// backend/src/routes/articulos.routes.js
// Rutas para el recurso Artículos
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/articulos.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRol } = require('../middlewares/roles.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { crearArticuloSchema, actualizarArticuloSchema } = require('../models/articulo.model');

const router = Router();

// Lectura: todos los roles autenticados
router.get('/',       requireAuth, requireRol('consultor', 'operador', 'admin'), ctrl.getList);
router.get('/:id',    requireAuth, requireRol('consultor', 'operador', 'admin'), ctrl.getById);

// Escritura: solo admin
router.post('/',      requireAuth, requireRol('admin'), validate(crearArticuloSchema),     ctrl.create);
router.put('/:id',    requireAuth, requireRol('admin'), validate(actualizarArticuloSchema), ctrl.update);
router.delete('/:id', requireAuth, requireRol('admin'),                                     ctrl.softDelete);

module.exports = router;
