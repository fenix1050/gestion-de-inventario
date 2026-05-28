// =============================================================
// frontend/src/services/articulos.service.js
// Wrapper de fetch al backend para el recurso artículos.
// No toca el DOM. Devuelve Promesas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Lista artículos con filtro opcional por nombre.
 * @param {Object} [params]
 * @param {string} [params.search] - texto a buscar en nombre
 * @param {AbortSignal} [params.signal] - para cancelar la petición en vuelo
 */
export function getArticulos({ search, signal } = {}) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch(`/articulos${qs}`, { signal });
}

/**
 * Obtiene un artículo por su ID.
 * @param {string|number} id
 */
export function getArticuloById(id) {
  return apiFetch(`/articulos/${id}`);
}

/**
 * Crea un nuevo artículo.
 * @param {Object} data - campos del artículo (sin id)
 */
export function crearArticulo(data) {
  return apiFetch('/articulos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Actualiza un artículo existente.
 * @param {string|number} id
 * @param {Object} data - campos a actualizar
 */
export function actualizarArticulo(id, data) {
  return apiFetch(`/articulos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Elimina (baja lógica) un artículo.
 * @param {string|number} id
 */
export function eliminarArticulo(id) {
  return apiFetch(`/articulos/${id}`, { method: 'DELETE' });
}

/**
 * Obtiene el siguiente código ART-XXX libre (incluye inactivos).
 */
export function getSiguienteCodigo() {
  return apiFetch('/articulos/siguiente-codigo');
}
