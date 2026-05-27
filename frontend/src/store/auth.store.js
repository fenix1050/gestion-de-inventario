// =============================================================
// frontend/src/store/auth.store.js
// Estado global de autenticación
// =============================================================

export const authStore = {
  user: null,
  token: null,

  /**
   * Lee el token de localStorage e inicializa el estado
   */
  async init() {
    const token = localStorage.getItem('tajy_auth_token');
    if (token) {
      // Si usáramos Supabase directo en el front, acá usaríamos supabase.auth.getUser()
      // Por ahora confiamos en el localStorage hasta hacer un fetch a la API (/api/auth/me)
      this.token = token;
      
      try {
        const userStr = localStorage.getItem('tajy_auth_user');
        if (userStr) {
          this.user = JSON.parse(userStr);
        }
      } catch (e) {
        console.error('Error al parsear el usuario', e);
      }
    }
  },

  /**
   * Inicia sesión (guarda token y usuario)
   */
  login(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('tajy_auth_token', token);
    localStorage.setItem('tajy_auth_user', JSON.stringify(user));
  },

  /**
   * Cierra sesión
   */
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('tajy_auth_token');
    localStorage.removeItem('tajy_auth_user');
    window.location.hash = '#/login';
  },

  /**
   * Devuelve si hay un usuario logueado
   */
  isLoggedIn() {
    return !!this.token;
  }
};
