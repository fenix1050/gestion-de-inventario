// =============================================================
// backend/src/routes/historial.routes.js
// Rutas para el historial unificado de movimientos
// =============================================================

const { Router } = require('express');
const ctrl = require('../controllers/historial.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = Router();

// Lectura: cualquier usuario autenticado (consultor, operador, admin)
// Sin validate() — todos los query params son opcionales
router.get('/', requireAuth, ctrl.listar);

module.exports = router;
