// =============================================================
// frontend/src/services/departamentos.service.js
// Wrapper de fetch al backend para el recurso departamentos.
// No toca el DOM. Devuelve Promesas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Lista todos los departamentos.
 * Se usa para poblar el select en el formulario de salidas.
 */
export function getDepartamentos() {
  return apiFetch('/departamentos');
}
