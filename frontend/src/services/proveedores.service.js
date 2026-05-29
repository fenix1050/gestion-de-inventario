// =============================================================
// frontend/src/services/proveedores.service.js
// Wrapper de fetch al backend para el recurso proveedores.
// No toca el DOM. Devuelve Promesas.
// =============================================================

import { apiFetch } from './api.js';

/**
 * Lista los proveedores activos.
 * Se usa para poblar el select en el formulario de ingresos.
 */
export function getProveedores() {
  return apiFetch('/proveedores');
}
