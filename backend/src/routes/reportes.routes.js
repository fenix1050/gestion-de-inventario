// =============================================================
// backend/src/routes/reportes.routes.js
// Rutas del módulo de reportes — todas requieren autenticación
// =============================================================

const { Router } = require('express');
const router = Router();
const reportesController = require('../controllers/reportes.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.use(requireAuth);

router.get('/consumo-periodo',      reportesController.getConsumoPorPeriodo);
router.get('/consumo-departamento', reportesController.getConsumoPorDepartamento);
router.get('/mas-consumidos',       reportesController.getMasConsumidos);
router.get('/valor-total',          reportesController.getValorTotal);
router.get('/proyeccion-stock',     reportesController.getProyeccionStock);
router.get('/exportar-excel',       reportesController.exportarExcel);

module.exports = router;
