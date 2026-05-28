// =============================================================
// frontend/src/services/auth.service.js
// Servicio para manejar el login directamente con Supabase
// =============================================================

import { CONFIG } from '../config.js';
import { authStore } from '../store/auth.store.js';
import { apiFetch } from './api.js';

export const authService = {
  /**
   * Inicia sesión llamando directamente a la API de Supabase Auth
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const url = `${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error_description || data.msg || 'Credenciales incorrectas');
    }

    // data contiene access_token y user (objeto crudo de Supabase, sin rol del sistema)
    const { access_token } = data;

    // Guardamos el token primero para que apiFetch pueda usarlo
    authStore.token = access_token;

    // Obtener el perfil enriquecido (con rol) desde nuestra tabla usuarios
    const perfil = await apiFetch('/auth/me');
    authStore.login(access_token, perfil);

    return perfil;
  },

  /**
   * Cierra sesión
   */
  logout() {
    authStore.logout();
  }
};
