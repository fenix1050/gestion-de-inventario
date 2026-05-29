// =============================================================
// frontend/src/pages/dashboard.js
// Página principal (Dashboard)
// =============================================================

import { authStore } from '../store/auth.store.js';

export const render = async (container) => {
  const user = authStore.user;
  const rol = user?.rol;
  const puedeVerIngresos = rol === 'operador' || rol === 'admin';
  const puedeVerSalidas  = rol === 'operador' || rol === 'admin';

  container.innerHTML = `
    <div style="padding: 2rem;">
      <h1>Dashboard</h1>
      <p>Bienvenido/a, <strong>${user?.email || 'Usuario'}</strong></p>
      <p style="color: var(--color-text-light); font-size: 0.875rem;">Rol: <strong>${rol || '—'}</strong></p>

      <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <button id="btn-articulos" style="padding: 0.5rem 1rem; cursor: pointer;">Ir a Artículos</button>
        <button id="btn-inventario" style="padding: 0.5rem 1rem; cursor: pointer;">Inventario</button>
        ${puedeVerIngresos
          ? `<button id="btn-ingresos" style="padding: 0.5rem 1rem; cursor: pointer;">Ingresos</button>`
          : ''}
        ${puedeVerSalidas
          ? `<button id="btn-salidas" style="padding: 0.5rem 1rem; cursor: pointer;">Salidas</button>`
          : ''}
        <button id="btn-historial" style="padding: 0.5rem 1rem; cursor: pointer;">Historial</button>
        <button id="btn-logout" style="padding: 0.5rem 1rem; cursor: pointer; color: red;">Cerrar sesión</button>
      </div>
    </div>
  `;

  document.getElementById('btn-articulos').addEventListener('click', () => {
    window.location.hash = '#/articulos';
  });

  document.getElementById('btn-inventario').addEventListener('click', () => {
    window.location.hash = '#/inventario';
  });

  if (puedeVerIngresos) {
    document.getElementById('btn-ingresos').addEventListener('click', () => {
      window.location.hash = '#/ingresos';
    });
  }

  if (puedeVerSalidas) {
    document.getElementById('btn-salidas').addEventListener('click', () => {
      window.location.hash = '#/salidas';
    });
  }

  document.getElementById('btn-historial').addEventListener('click', () => {
    window.location.hash = '#/historial';
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    authStore.logout();
  });
};
