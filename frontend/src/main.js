// =============================================================
// frontend/src/main.js
// Punto de entrada de la aplicación frontend
// =============================================================

import { initRouter } from './router/router.js';
import { authStore } from './store/auth.store.js';
import { Sidebar } from './components/Sidebar.js';

// Cuando el DOM esté listo, iniciamos la app
document.addEventListener('DOMContentLoaded', async () => {
  // Verificamos si hay un token válido antes de arrancar el router
  await authStore.init();

  // Si ya hay sesión activa (refresh de página), montamos el sidebar
  // ANTES de initRouter() para que #page-content exista en la primera navegación
  if (authStore.isLoggedIn()) {
    Sidebar.mount(document.getElementById('app'));
  }

  // Iniciamos el enrutador SPA
  initRouter();
});
