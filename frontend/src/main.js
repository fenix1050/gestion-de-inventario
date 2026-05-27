// =============================================================
// frontend/src/main.js
// Punto de entrada de la aplicación frontend
// =============================================================

import { initRouter } from './router/router.js';
import { authStore } from './store/auth.store.js';

// Cuando el DOM esté listo, iniciamos la app
document.addEventListener('DOMContentLoaded', async () => {
  // Verificamos si hay un token válido antes de arrancar el router
  await authStore.init();

  // Iniciamos el enrutador SPA
  initRouter();
});
