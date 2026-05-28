// =============================================================
// backend/src/routes/index.js
// Router raíz — registra todas las rutas bajo /api
// Agregar acá cada nuevo recurso a medida que se implementa
// =============================================================

const { Router } = require('express');

const router = Router();

// --- Rutas disponibles (se van descomentando a medida que se implementan) ---
router.use('/auth',         require('./auth.routes'));
router.use('/articulos',    require('./articulos.routes'));
// router.use('/ingresos',     require('./ingresos.routes'));
// router.use('/salidas',      require('./salidas.routes'));
// router.use('/proveedores',  require('./proveedores.routes'));
// router.use('/departamentos',require('./departamentos.routes'));
// router.use('/historial',    require('./historial.routes'));
// router.use('/reportes',     require('./reportes.routes'));

// Ruta de prueba — confirma que la API responde correctamente
router.get('/', (_req, res) => {
  res.json({ success: true, message: 'API Gestión Tajy funcionando correctamente.' });
});

module.exports = router;
