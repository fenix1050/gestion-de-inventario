// =============================================================
// backend/src/app.js
// Configuración de la aplicación Express.
// Acá se registran middlewares globales y rutas.
// server.js importa este app y lo pone a escuchar en un puerto.
// =============================================================

const express = require('express');
const cors    = require('cors');
const env     = require('../config/env');
const logger  = require('./utils/logger');
const routes  = require('./routes/index');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// -------------------------------------------------------------
// CORS — permite llamadas desde el frontend (Netlify / localhost)
// CORS_ORIGINS es un array: ['http://localhost:5500', 'https://...']
// -------------------------------------------------------------
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej: curl, Postman, Railway health checks)
    if (!origin) return callback(null, true);

    if (env.CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS bloqueado para origin: ${origin}`);
      callback(new Error(`Origin no permitido por CORS: ${origin}`));
    }
  },
  credentials: true,
}));

// -------------------------------------------------------------
// Parseo de body JSON
// Límite de 1mb — los insumos no tienen imágenes, no necesitamos más
// -------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));

// -------------------------------------------------------------
// Log de requests en desarrollo
// -------------------------------------------------------------
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
  });
}

// -------------------------------------------------------------
// Rutas de la API
// Todas las rutas están bajo /api
// -------------------------------------------------------------
app.use('/api', routes);

// -------------------------------------------------------------
// Health check — Railway y Render lo usan para verificar que
// el servidor está vivo. No requiere autenticación.
// -------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// 404 — ruta no encontrada
// Cualquier ruta que no coincida con las de arriba cae acá
// -------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
});

// -------------------------------------------------------------
// Error handler global
// Express lo llama cuando un middleware hace next(error)
// Debe tener los 4 parámetros (err, req, res, next) para que
// Express lo reconozca como error handler
// -------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
