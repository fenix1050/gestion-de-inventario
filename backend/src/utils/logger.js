// =============================================================
// backend/src/utils/logger.js
// Logger simple para reemplazar console.log en producción.
// En desarrollo muestra todo. En producción solo warn y error.
// =============================================================

const env = require('../../config/env');

const esDev = env.NODE_ENV === 'development';

const logger = {
  info: (...args) => {
    if (esDev) console.log('[INFO]', ...args);
  },
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
};

module.exports = logger;
