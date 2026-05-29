// =============================================================
// frontend/src/services/reportes.service.js
// Wrappers de fetch() hacia los endpoints de reportes del backend
// apiFetch ya retorna data.data directamente (el payload)
// =============================================================

import { apiFetch } from '../services/api.js';

/**
 * Consumo de artículos agrupado por período.
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} params
 */
export function getConsumoPorPeriodo(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/reportes/consumo-periodo?${qs}`);
}

/**
 * Consumo agrupado por departamento.
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} params
 */
export function getConsumoPorDepartamento(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/reportes/consumo-departamento?${qs}`);
}

/**
 * Top artículos más consumidos.
 * @param {{ fecha_desde?: string, fecha_hasta?: string, limit?: number }} params
 */
export function getMasConsumidos(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/reportes/mas-consumidos?${qs}`);
}

/**
 * Valor total de salidas en el período.
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} params
 */
export function getValorTotal(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/reportes/valor-total?${qs}`);
}

/**
 * Proyección de stock basada en consumo de los últimos 30 días.
 */
export function getProyeccionStock() {
  return apiFetch('/reportes/proyeccion-stock');
}
