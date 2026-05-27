// =============================================================
// frontend/src/services/auth.service.js
// Servicio para manejar el login directamente con Supabase
// =============================================================

import { CONFIG } from '../config.js';
import { authStore } from '../store/auth.store.js';

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

    // data contiene access_token y user
    const { access_token, user } = data;
    
    // Guardamos en el store global
    authStore.login(access_token, user);
    
    return user;
  },

  /**
   * Cierra sesión
   */
  logout() {
    authStore.logout();
  }
};
