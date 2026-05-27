// =============================================================
// backend/src/utils/dateHelpers.js
// Funciones de fecha para el sistema (locale es-PY, GMT-4)
// =============================================================

/**
 * Formatea una fecha ISO a DD/MM/YYYY (formato paraguayo)
 * @param {string|Date} fecha
 * @returns {string} Ej: "26/05/2026"
 */
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-PY', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
    timeZone: 'America/Asuncion',
  });
};

/**
 * Formatea una fecha ISO a DD/MM/YYYY HH:MM (con hora)
 * @param {string|Date} fecha
 * @returns {string} Ej: "26/05/2026 14:30"
 */
const formatearFechaHora = (fecha) => {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-PY', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: 'America/Asuncion',
  });
};

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD (para columnas date de Postgres)
 * @returns {string} Ej: "2026-05-26"
 */
const hoyISO = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Asuncion' });
};

module.exports = { formatearFecha, formatearFechaHora, hoyISO };
