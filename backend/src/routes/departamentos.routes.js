// =============================================================
// backend/src/routes/departamentos.routes.js
// Rutas para el recurso Departamentos (solo lectura en esta fase)
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/departamentos.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/', requireAuth, ctrl.listar);

module.exports = router;
