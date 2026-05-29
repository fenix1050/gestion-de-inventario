// =============================================================
// frontend/src/services/salidas.service.js
// Wrapper de fetch al backend para el recurso salidas.
// No toca el DOM. Devuelve Promesas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Lista salidas con filtros opcionales.
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.articulo_id]
 * @param {string} [params.departamento_id]
 * @param {string} [params.fecha_desde] - ISO date
 * @param {string} [params.fecha_hasta] - ISO date
 */
export function getSalidas(params = {}) {
  const qs = new URLSearchParams();
  if (params.page           != null) qs.set('page',            params.page);
  if (params.limit          != null) qs.set('limit',           params.limit);
  if (params.articulo_id)            qs.set('articulo_id',     params.articulo_id);
  if (params.departamento_id)        qs.set('departamento_id', params.departamento_id);
  if (params.fecha_desde)            qs.set('fecha_desde',     params.fecha_desde);
  if (params.fecha_hasta)            qs.set('fecha_hasta',     params.fecha_hasta);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/salidas${query}`);
}

/**
 * Registra una nueva salida del depósito.
 * @param {Object} payload - campos del formulario
 * @returns {{ salida: Object, stock_actual: number }}
 */
export function crearSalida(payload) {
  return apiFetch('/salidas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
