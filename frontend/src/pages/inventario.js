// =============================================================
// frontend/src/pages/inventario.js
// Control de inventario en vivo — muestra stock actual de todos los artículos.
// =============================================================

import { getArticulos } from '../services/articulos.service.js';
import { createLoader } from '../utils/loader.js';

let debounceTimer  = null;
let articulosTodos = [];

export const render = async (container) => {
  container.innerHTML = `
    <div class="page page--inventario">
      <div class="page__header">
        <div>
          <h1>Control de Inventario</h1>
          <p class="page__subtitle">Monitoreo en vivo. El stock se calcula automáticamente sumando ingresos y restando salidas hasta la fecha actual.</p>
        </div>
      </div>

      <div class="toolbar">
        <div class="toolbar__search">
          <input
            type="search"
            id="input-buscar"
            class="input"
            placeholder="Buscar por artículo o código..."
            autocomplete="off"
          />
        </div>
      </div>

      <div class="table-wrapper">
        <div id="inventario-container">${createLoader('Cargando...')}</div>
      </div>
    </div>
  `;

  document.getElementById('input-buscar').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderTabla(q), 200);
  });

  await cargarArticulos();
};

async function cargarArticulos() {
  const cont = document.getElementById('inventario-container');
  if (!cont) return;

  try {
    articulosTodos = await getArticulos() ?? [];
    renderTabla('');
  } catch (err) {
    cont.innerHTML = `<p class="error-message">Error: ${err.message}</p>`;
  }
}

function renderTabla(q) {
  const cont = document.getElementById('inventario-container');
  if (!cont) return;

  const filtrados = q
    ? articulosTodos.filter(a =>
        a.nombre.toLowerCase().includes(q) ||
        a.codigo.toLowerCase().includes(q)
      )
    : articulosTodos;

  if (filtrados.length === 0) {
    cont.innerHTML = `<p class="empty-state">No se encontraron artículos.</p>`;
    return;
  }

  const filas = filtrados.map((art) => {
    const stockBajo = art.stock_minimo != null && art.stock_actual <= art.stock_minimo;
    const stockClass = art.stock_actual === 0
      ? 'stock--cero'
      : stockBajo
        ? 'stock--bajo'
        : 'stock--ok';

    return `
      <tr>
        <td>${escapeHtml(art.codigo)}</td>
        <td><strong>${escapeHtml(art.nombre)}</strong></td>
        <td class="stock-cell">
          <span class="stock-valor ${stockClass}">${art.stock_actual}</span>
          <span class="stock-unidad">${escapeHtml(art.unidad_medida ?? '')}</span>
        </td>
      </tr>
    `;
  }).join('');

  cont.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Código Artículo</th>
          <th>Nombre</th>
          <th>Stock Actual</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
