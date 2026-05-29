// =============================================================
// frontend/src/router/router.js
// Enrutador de la SPA (Single Page Application)
// Maneja el cambio de URL sin recargar la página
// =============================================================

import { authStore } from '../store/auth.store.js';

// Diccionario de rutas y sus funciones de renderizado
const routes = {
  '/login': async () => {
    const { render } = await import('../pages/login.js');
    return render;
  },
  '/dashboard': async () => {
    const { render } = await import('../pages/dashboard.js');
    return render;
  },
  '/articulos': async () => {
    const { render } = await import('../pages/articulos.js');
    return render;
  },
  '/ingresos': async () => {
    const { render } = await import('../pages/ingresos.js');
    return render;
  },
  '/salidas': async () => {
    const { render } = await import('../pages/salidas.js');
    return render;
  },
  '/historial': async () => {
    const { render } = await import('../pages/historial.js');
    return render;
  },
  // Agregaremos más a medida que se implementen
};

/**
 * Función principal que lee la URL y carga la página correcta
 */
const handleRoute = async () => {
  // La ruta actual viene del hash, ej: #/articulos -> /articulos
  // Si no hay hash, default a /dashboard
  let path = window.location.hash.slice(1) || '/dashboard';

  // Guardia de navegación: si no está logueado y no va al login, lo mandamos al login
  if (!authStore.isLoggedIn() && path !== '/login') {
    window.location.hash = '#/login';
    return;
  }

  // Si está logueado e intenta ir al login, lo mandamos al dashboard
  if (authStore.isLoggedIn() && path === '/login') {
    window.location.hash = '#/dashboard';
    return;
  }

  const appContainer = document.getElementById('app');
  
  // Limpiamos el contenedor
  appContainer.innerHTML = '<div class="loader-container">Cargando...</div>';

  try {
    const routeResolver = routes[path];
    
    if (routeResolver) {
      const renderPage = await routeResolver();
      await renderPage(appContainer);
    } else {
      // 404
      appContainer.innerHTML = '<h1>404 - Página no encontrada</h1>';
    }
  } catch (error) {
    console.error(`Error al cargar la ruta ${path}:`, error);
    appContainer.innerHTML = `<h1>Error al cargar la página</h1><p>${error.message}</p>`;
  }
};

/**
 * Inicializa el enrutador escuchando los cambios de hash
 */
export const initRouter = () => {
  // Escuchar cuando el usuario navega (adelante/atrás o clicks en links)
  window.addEventListener('hashchange', handleRoute);
  
  // Ejecutar para la primera carga de la página
  handleRoute();
};
