// =============================================================
// frontend/src/services/usuarios.service.js
// Wrapper de fetch al backend para el recurso usuarios.
// No toca el DOM. Devuelve Promesas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Lista usuarios del sistema.
 * @param {Object} [params]
 * @param {boolean} [params.activo] - si se omite, devuelve solo activos (default del backend)
 * @returns {Promise<Array>}
 */
export function getUsuarios(params = {}) {
  const qs = new URLSearchParams();
  if (params.activo !== undefined) qs.set('activo', params.activo);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/usuarios${query}`);
}

/**
 * Crea un nuevo usuario.
 * @param {Object} payload - { email, password, nombre_completo, rol, departamento_id?, cedula?, telefono? }
 * @returns {Promise<Object>}
 */
export function crearUsuario(payload) {
  return apiFetch('/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza datos de un usuario existente.
 * @param {string} id - UUID del usuario
 * @param {Object} payload - campos a actualizar (nombre_completo, rol, departamento_id, activo)
 * @returns {Promise<Object>}
 */
export function actualizarUsuario(id, payload) {
  return apiFetch(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Desactiva (soft-delete) un usuario.
 * @param {string} id - UUID del usuario
 * @returns {Promise<Object>}
 */
export function desactivarUsuario(id) {
  return apiFetch(`/usuarios/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Reactiva un usuario previamente desactivado.
 * Reutiliza PUT con { activo: true } — no hay endpoint separado.
 * @param {string} id - UUID del usuario
 * @returns {Promise<Object>}
 */
export function reactivarUsuario(id) {
  return apiFetch(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ activo: true }),
  });
}
