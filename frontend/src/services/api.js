// =============================================================
// frontend/src/services/api.js
// Wrapper para llamadas a la API (fetch)
// =============================================================

import { CONFIG } from '../config.js';
import { authStore } from '../store/auth.store.js';

/**
 * Función centralizada para hacer peticiones al backend.
 * Automáticamente inyecta el token JWT si existe.
 * @param {string} endpoint - Ej: '/articulos'
 * @param {Object} options - Opciones de fetch (method, body, headers...)
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${CONFIG.API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Si hay usuario logueado, inyectar el token
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Validar error 401 (token expirado)
    if (res.status === 401) {
      authStore.logout();
      throw new Error('Tu sesión expiró. Iniciá sesión de nuevo.');
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Ocurrió un error en el servidor.');
    }

    return data.data; // Retorna solo el payload "data"
  } catch (error) {
    // Si fetch falla (ej: sin internet o servidor caido)
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar al servidor. Revisá tu conexión.');
    }
    throw error;
  }
}
