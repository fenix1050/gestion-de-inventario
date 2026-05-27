// =============================================================
// backend/config/env.js
// Carga y valida las variables de entorno al iniciar el servidor.
// Si falta una variable crítica, el proceso termina con error claro.
// Importar este módulo ANTES que cualquier otro en server.js
// =============================================================

require('dotenv').config();

// Variables requeridas para que el servidor funcione
const REQUERIDAS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
];

const faltantes = REQUERIDAS.filter((key) => !process.env[key]);

if (faltantes.length > 0) {
  console.error(
    `[env] Error: faltan las siguientes variables de entorno: ${faltantes.join(', ')}\n` +
    `[env] Copiá backend/.env.example como backend/.env y completá los valores.`
  );
  process.exit(1);
}

module.exports = {
  NODE_ENV:             process.env.NODE_ENV || 'development',
  PORT:                 parseInt(process.env.PORT, 10) || 3000,
  SUPABASE_URL:         process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  JWT_SECRET:           process.env.JWT_SECRET,
  // CORS_ORIGIN puede ser una lista separada por coma
  CORS_ORIGINS:         (process.env.CORS_ORIGIN || 'http://localhost:5500').split(','),
};
