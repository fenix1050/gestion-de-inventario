// =============================================================
// frontend/src/services/usuarios.service.js
// Wrapper de fetch al backend para el recurso usuarios.
// No toca el DOM. Devuelve Promesas.
//
// TODO: conectar a GET /api/usuarios cuando el endpoint de gestión
// de usuarios esté implementado (Fase 4). Por ahora devuelve lista
// vacía para no bloquear el formulario de salidas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Obtiene la lista de usuarios activos para el select de colaboradores.
 * @returns {Promise<Array>} lista de usuarios con id y nombre_completo
 */
export async function getUsuarios() {
  try {
    return await apiFetch('/usuarios');
  } catch {
    // El endpoint aún no existe — devolver lista vacía sin romper el formulario
    return [];
  }
}
