// =============================================================
// backend/server.js
// Punto de entrada del servidor.
// Solo arranca el listener — la configuración está en app.js.
// =============================================================

// env.js debe ser lo primero: carga dotenv y valida variables
const env    = require('./config/env');
const app    = require('./src/app');
const logger = require('./src/utils/logger');

app.listen(env.PORT, () => {
  logger.info(`Servidor corriendo en http://localhost:${env.PORT}`);
  logger.info(`Entorno: ${env.NODE_ENV}`);
});
