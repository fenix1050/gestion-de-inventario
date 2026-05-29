// =============================================================
// frontend/src/services/historial.service.js
// Wrapper de fetch al backend para el historial de movimientos.
// No toca el DOM. Devuelve Promesas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Lista el historial unificado de movimientos con filtros opcionales.
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {'ingreso'|'salida'} [params.tipo]
 * @param {string} [params.articulo_id] - uuid
 * @param {string} [params.fecha_desde] - ISO date (YYYY-MM-DD)
 * @param {string} [params.fecha_hasta] - ISO date (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export function getHistorial(params = {}) {
  const qs = new URLSearchParams();
  if (params.page        != null) qs.set('page',        params.page);
  if (params.limit       != null) qs.set('limit',       params.limit);
  if (params.tipo)                qs.set('tipo',        params.tipo);
  if (params.articulo_id)         qs.set('articulo_id', params.articulo_id);
  if (params.fecha_desde)         qs.set('fecha_desde', params.fecha_desde);
  if (params.fecha_hasta)         qs.set('fecha_hasta', params.fecha_hasta);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/historial${query}`);
}
