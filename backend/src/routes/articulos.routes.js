// =============================================================
// backend/src/routes/articulos.routes.js
// Rutas para el recurso Artículos
// =============================================================

const { Router } = require('express');
const articulosController = require('../controllers/articulos.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
// const { requireRol } = require('../middlewares/roles.middleware'); // Se usará después

const router = Router();

// Todos los endpoints de artículos requieren autenticación
router.use(requireAuth);

// GET /api/articulos -> Listado de artículos
router.get('/', articulosController.getList);

module.exports = router;
