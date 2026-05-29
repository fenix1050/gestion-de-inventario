// =============================================================
// backend/src/routes/proveedores.routes.js
// Rutas para el recurso Proveedores (solo lectura en esta fase)
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/proveedores.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', requireAuth, ctrl.listar);

module.exports = router;
