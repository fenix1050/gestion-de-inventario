// =============================================================
// frontend/src/pages/historial.js
// Página de solo lectura: historial unificado de movimientos.
// Visible a todos los roles. Sin botón de acción.
// Filtros en la misma página: tipo, artículo, rango de fechas.
// =============================================================

import { getHistorial } from '../services/historial.service.js';
import { getArticulos } from '../services/articulos.service.js';
import { Toast } from '../components/Toast.js';

const LIMIT = 20;
let paginaActual = 1;
let filtrosActivos = {};

export const render = async (container) => {
  container.innerHTML = `
    <div class="page page--historial">
      <div class="page__header">
        <h1>Historial de Movimientos</h1>
        <div class="page__header-actions">
          <button type="button" id="btn-volver" class="btn btn--secondary">Volver al Dashboard</button>
        </div>
      </div>

      <div class="filtros-bar" id="filtros-bar">
        <select id="filtro-tipo" class="filtro-select">
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="salida">Salida</option>
        </select>

        <select id="filtro-articulo" class="filtro-select">
          <option value="">Todos los artículos</option>
        </select>

        <label class="filtro-label">
          Desde
          <input type="date" id="filtro-fecha-desde" class="filtro-input">
        </label>

        <label class="filtro-label">
          Hasta
          <input type="date" id="filtro-fecha-hasta" class="filtro-input">
        </label>

        <button type="button" id="btn-aplicar-filtros" class="btn btn--primary">Aplicar filtros</button>
        <button type="button" id="btn-limpiar-filtros" class="btn btn--secondary">Limpiar</button>
      </div>

      <div class="table-wrapper">
        <div id="historial-container">Cargando historial...</div>
      </div>

      <div id="paginacion-historial" class="pagination"></div>
    </div>
  `;

  document.getElementById('btn-volver')
    .addEventListener('click', () => { window.location.hash = '#/dashboard'; });

  document.getElementById('btn-aplicar-filtros')
    .addEventListener('click', () => {
      filtrosActivos = leerFiltros();
      paginaActual = 1;
      cargarHistorial();
    });

  document.getElementById('btn-limpiar-filtros')
    .addEventListener('click', () => {
      document.getElementById('filtro-tipo').value = '';
      document.getElementById('filtro-articulo').value = '';
      document.getElementById('filtro-fecha-desde').value = '';
      document.getElementById('filtro-fecha-hasta').value = '';
      filtrosActivos = {};
      paginaActual = 1;
      cargarHistorial();
    });

  // Cargar artículos para el select de filtro (silencioso si falla)
  try {
    const articulos = await getArticulos();
    const selectArticulo = document.getElementById('filtro-articulo');
    if (selectArticulo && articulos?.length) {
      articulos.forEach((a) => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${escapeHtml(a.codigo)} — ${escapeHtml(a.nombre)}`;
        selectArticulo.appendChild(opt);
      });
    }
  } catch (_) {
    // No bloquea la carga del historial
  }

  paginaActual = 1;
  filtrosActivos = {};
  await cargarHistorial();
};

function leerFiltros() {
  const tipo         = document.getElementById('filtro-tipo')?.value || undefined;
  const articulo_id  = document.getElementById('filtro-articulo')?.value || undefined;
  const fecha_desde  = document.getElementById('filtro-fecha-desde')?.value || undefined;
  const fecha_hasta  = document.getElementById('filtro-fecha-hasta')?.value || undefined;
  return { tipo, articulo_id, fecha_desde, fecha_hasta };
}

async function cargarHistorial() {
  const cont = document.getElementById('historial-container');
  if (!cont) return;

  cont.innerHTML = '<p class="loading-state">Cargando...</p>';

  try {
    const data = await getHistorial({
      page:  paginaActual,
      limit: LIMIT,
      ...filtrosActivos,
    });
    renderTabla(cont, data || []);
    renderPaginacion(data || []);
  } catch (err) {
    cont.innerHTML = `<p class="error-message">Error al cargar el historial: ${escapeHtml(err.message)}</p>`;
    Toast.error(err.message);
  }
}

function renderTabla(cont, movimientos) {
  if (movimientos.length === 0) {
    cont.innerHTML = `<p class="empty-state">No hay movimientos registrados para los filtros seleccionados.</p>`;
    return;
  }

  const filas = movimientos.map((m) => {
    const esIngreso   = m.tipo === 'ingreso';
    const badgeClass  = esIngreso ? 'badge--success' : 'badge--danger';
    const badgeLabel  = esIngreso ? 'Entrada' : 'Salida';
    const cantDisplay = esIngreso ? `+${m.cantidad}` : `-${m.cantidad}`;
    const cantClass   = esIngreso ? 'cantidad--positiva' : 'cantidad--negativa';
    const origenDestino = esIngreso
      ? escapeHtml(m.proveedor_nombre ?? m.proveedor ?? '—')
      : escapeHtml(m.departamento_nombre ?? m.colaborador ?? '—');

    return `
      <tr>
        <td>${formatFecha(m.fecha)}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
        <td>${escapeHtml(m.articulo_nombre ?? '—')}</td>
        <td class="cantidad-cell"><span class="${cantClass}">${cantDisplay}</span></td>
        <td>${origenDestino}</td>
      </tr>
    `;
  }).join('');

  cont.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Artículo</th>
          <th>Cantidad</th>
          <th>Origen / Destino</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function renderPaginacion(movimientos) {
  const cont = document.getElementById('paginacion-historial');
  if (!cont) return;

  const hayAnterior  = paginaActual > 1;
  const haySiguiente = movimientos.length === LIMIT;

  if (!hayAnterior && !haySiguiente) {
    cont.innerHTML = '';
    return;
  }

  cont.innerHTML = `
    <button type="button" id="btn-anterior" class="btn btn--secondary" ${hayAnterior ? '' : 'disabled'}>Anterior</button>
    <span class="pagination__info">Página ${paginaActual}</span>
    <button type="button" id="btn-siguiente" class="btn btn--secondary" ${haySiguiente ? '' : 'disabled'}>Siguiente</button>
  `;

  if (hayAnterior) {
    document.getElementById('btn-anterior').addEventListener('click', () => {
      paginaActual--;
      cargarHistorial();
    });
  }
  if (haySiguiente) {
    document.getElementById('btn-siguiente').addEventListener('click', () => {
      paginaActual++;
      cargarHistorial();
    });
  }
}

// ------- Utilidades locales -------

function formatFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
