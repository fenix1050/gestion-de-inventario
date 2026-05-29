// =============================================================
// frontend/src/services/ingresos.service.js
// Wrapper de fetch al backend para el recurso ingresos.
// No toca el DOM. Devuelve Promesas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Lista ingresos con filtros opcionales.
 * @param {Object} [params]
 * @param {string} [params.articulo_id]
 * @param {string} [params.proveedor_id]
 * @param {string} [params.desde] - ISO date
 * @param {string} [params.hasta] - ISO date
 * @param {number} [params.limit=20]
 * @param {number} [params.offset=0]
 */
export function getIngresos(params = {}) {
  const qs = new URLSearchParams();
  if (params.articulo_id)  qs.set('articulo_id',  params.articulo_id);
  if (params.proveedor_id) qs.set('proveedor_id', params.proveedor_id);
  if (params.desde)        qs.set('desde',        params.desde);
  if (params.hasta)        qs.set('hasta',        params.hasta);
  if (params.limit  != null) qs.set('limit',  params.limit);
  if (params.offset != null) qs.set('offset', params.offset);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/ingresos${query}`);
}

/**
 * Registra un nuevo ingreso al depósito.
 * @param {Object} payload - campos del formulario
 * @returns {{ ingreso: Object, stock_actual: number }}
 */
export function crearIngreso(payload) {
  return apiFetch('/ingresos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
