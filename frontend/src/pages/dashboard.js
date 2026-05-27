// =============================================================
// frontend/src/pages/dashboard.js
// Página principal (Dashboard)
// =============================================================

import { authStore } from '../store/auth.store.js';

export const render = async (container) => {
  const user = authStore.user;
  
  container.innerHTML = `
    <div style="padding: 2rem;">
      <h1>Dashboard</h1>
      <p>Bienvenido/a, <strong>${user?.user_metadata?.nombre_completo || user?.email || 'Usuario'}</strong>!</p>
      
      <div style="margin-top: 2rem; display: flex; gap: 1rem;">
        <button id="btn-articulos" style="padding: 0.5rem 1rem; cursor: pointer;">Ir a Artículos</button>
        <button id="btn-logout" style="padding: 0.5rem 1rem; cursor: pointer; color: red;">Cerrar sesión</button>
      </div>
    </div>
  `;

  document.getElementById('btn-articulos').addEventListener('click', () => {
    window.location.hash = '#/articulos';
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    authStore.logout();
  });
};
