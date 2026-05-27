// =============================================================
// frontend/src/pages/articulos.js
// Página de listado de artículos (Paso 10)
// =============================================================

import { apiFetch } from '../services/api.js';

export const render = async (container) => {
  container.innerHTML = `
    <div style="padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>Catálogo de Artículos</h1>
        <button id="btn-volver" style="padding: 0.5rem 1rem; cursor: pointer;">Volver al Dashboard</button>
      </div>

      <div id="articulos-container">Cargando artículos...</div>
    </div>
  `;

  document.getElementById('btn-volver').addEventListener('click', () => {
    window.location.hash = '#/dashboard';
  });

  const articulosContainer = document.getElementById('articulos-container');

  try {
    // Obtenemos los artículos desde la API (ya inyecta el token)
    const articulos = await apiFetch('/articulos');

    if (!articulos || articulos.length === 0) {
      articulosContainer.innerHTML = '<p>No se encontraron artículos.</p>';
      return;
    }

    let tabla = `
      <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: var(--shadow-sm);">
        <thead style="background: var(--color-background-alt); text-align: left;">
          <tr>
            <th style="padding: 1rem; border-bottom: 2px solid var(--color-border);">Código</th>
            <th style="padding: 1rem; border-bottom: 2px solid var(--color-border);">Nombre</th>
            <th style="padding: 1rem; border-bottom: 2px solid var(--color-border);">Categoría</th>
            <th style="padding: 1rem; border-bottom: 2px solid var(--color-border);">Stock</th>
          </tr>
        </thead>
        <tbody>
    `;

    articulos.forEach(art => {
      const stockBadge = art.stock_actual <= art.stock_minimo 
        ? `<span style="color: var(--color-danger); font-weight: bold;">${art.stock_actual} (Bajo)</span>`
        : `<span style="color: var(--color-success);">${art.stock_actual}</span>`;

      tabla += `
        <tr>
          <td style="padding: 1rem; border-bottom: 1px solid var(--color-border);">${art.codigo}</td>
          <td style="padding: 1rem; border-bottom: 1px solid var(--color-border);">${art.nombre}</td>
          <td style="padding: 1rem; border-bottom: 1px solid var(--color-border);">${art.categoria}</td>
          <td style="padding: 1rem; border-bottom: 1px solid var(--color-border);">${stockBadge}</td>
        </tr>
      `;
    });

    tabla += `</tbody></table>`;
    articulosContainer.innerHTML = tabla;

  } catch (error) {
    articulosContainer.innerHTML = `<p style="color: var(--color-danger);">Error: ${error.message}</p>`;
  }
};
