// =============================================================
// frontend/src/pages/reportes.js
// Página de reportes y análisis de consumo de insumos
// =============================================================

import { showToast } from '../components/Toast.js';
import * as reportesService from '../services/reportes.service.js';
import { authStore } from '../store/auth.store.js';
import { CONFIG } from '../config.js';
import { createLoader } from '../utils/loader.js';

// Instancia activa del chart — se destruye antes de crear uno nuevo
let chartActual = null;

/**
 * Formatea un número como moneda guaraní (es-PY).
 * @param {number} valor
 * @returns {string}
 */
function formatearGs(valor) {
  return new Intl.NumberFormat('es-PY').format(valor);
}

/**
 * Crea o reemplaza el chart en un canvas dado.
 * @param {string} canvasId
 * @param {object} config - Configuración Chart.js
 */
function renderChart(canvasId, config) {
  if (chartActual) {
    chartActual.destroy();
    chartActual = null;
  }
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  chartActual = new Chart(canvas, config);
}

/**
 * Descarga el reporte completo como archivo Excel multi-hoja desde el backend.
 * No usa apiFetch porque ese wrapper llama a res.json() y no sirve para blobs.
 * @param {string} fechaDesde
 * @param {string} fechaHasta
 * @param {HTMLButtonElement} btnEl
 */
async function descargarExcel(fechaDesde, fechaHasta, btnEl) {
  try {
    btnEl.disabled = true;
    btnEl.textContent = 'Generando...';

    const token = authStore.token;
    const params = new URLSearchParams();
    if (fechaDesde) params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params.set('fecha_hasta', fechaHasta);

    const res = await fetch(`${CONFIG.API_URL}/reportes/exportar-excel?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Error al generar el archivo');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `reporte-inventario-${fecha}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showToast('Error al descargar el Excel: ' + err.message, 'error');
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = 'Descargar Excel';
  }
}

/**
 * Genera y dispara la descarga de un CSV a partir de un array de objetos.
 * @param {object[]} data
 * @param {string} filename
 */
function descargarCSV(data, filename) {
  if (!data?.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h] ?? '').join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------
// Renderers por tab
// ------------------------------------------------------------------

function renderConsumoPeriodo(data, panel) {
  panel.innerHTML = `
    <div class="reporte-panel__header">
      <div>
        <h2 class="reporte-panel__title">Consumo por Período</h2>
        <p class="reporte-panel__subtitle">Artículos consumidos en el rango seleccionado</p>
      </div>
      <button class="btn btn-secondary" id="btn-descargar-csv">Descargar CSV</button>
    </div>
    <div class="reporte-chart-container">
      <canvas id="chart-periodo"></canvas>
    </div>
    <div class="reporte-tabla-container">
      <table class="table">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Cantidad</th>
            <th>Valor Total (Gs.)</th>
          </tr>
        </thead>
        <tbody>
          ${data.length
            ? data.map(d => `
              <tr>
                <td>${d.nombre}</td>
                <td>${d.cantidad}</td>
                <td>${formatearGs(d.total_gs)}</td>
              </tr>`).join('')
            : '<tr><td colspan="3" class="table-empty">No hay datos para el período seleccionado.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  renderChart('chart-periodo', {
    type: 'bar',
    data: {
      labels: data.map(d => d.nombre),
      datasets: [{
        label: 'Cantidad consumida',
        data: data.map(d => d.cantidad),
        backgroundColor: '#8B1A1A',
      }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });

  panel.querySelector('#btn-descargar-csv').addEventListener('click', () => {
    descargarCSV(data, 'consumo-periodo.csv');
  });
}

function renderConsumoDepartamento(data, panel) {
  const COLORES = [
    '#8B1A1A','#C0392B','#E74C3C','#F39C12','#F1C40F',
    '#2ECC71','#27AE60','#3498DB','#2980B9','#9B59B6','#8E44AD','#1ABC9C',
  ];

  panel.innerHTML = `
    <div class="reporte-panel__header">
      <div>
        <h2 class="reporte-panel__title">Consumo por Departamento</h2>
        <p class="reporte-panel__subtitle">Distribución del consumo entre departamentos</p>
      </div>
      <button class="btn btn-secondary" id="btn-descargar-csv">Descargar CSV</button>
    </div>
    <div class="reporte-chart-container">
      <canvas id="chart-departamento"></canvas>
    </div>
    <div class="reporte-tabla-container">
      <table class="table">
        <thead>
          <tr>
            <th>Departamento</th>
            <th>Cantidad</th>
            <th>Valor Total (Gs.)</th>
          </tr>
        </thead>
        <tbody>
          ${data.length
            ? data.map(d => `
              <tr>
                <td>${d.nombre}</td>
                <td>${d.cantidad}</td>
                <td>${formatearGs(d.total_gs)}</td>
              </tr>`).join('')
            : '<tr><td colspan="3" class="table-empty">No hay datos para el período seleccionado.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  renderChart('chart-departamento', {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.nombre),
      datasets: [{
        data: data.map(d => d.cantidad),
        backgroundColor: COLORES.slice(0, data.length),
      }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });

  panel.querySelector('#btn-descargar-csv').addEventListener('click', () => {
    descargarCSV(data, 'consumo-departamento.csv');
  });
}

function renderMasConsumidos(data, panel) {
  panel.innerHTML = `
    <div class="reporte-panel__header">
      <div>
        <h2 class="reporte-panel__title">Artículos Más Consumidos</h2>
        <p class="reporte-panel__subtitle">Top 10 por cantidad en el período seleccionado</p>
      </div>
      <button class="btn btn-secondary" id="btn-descargar-csv">Descargar CSV</button>
    </div>
    <div class="reporte-chart-container">
      <canvas id="chart-mas-consumidos"></canvas>
    </div>
    <div class="reporte-tabla-container">
      <table class="table">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Cantidad</th>
            <th>Valor Total (Gs.)</th>
          </tr>
        </thead>
        <tbody>
          ${data.length
            ? data.map(d => `
              <tr>
                <td>${d.nombre}</td>
                <td>${d.cantidad}</td>
                <td>${formatearGs(d.total_gs)}</td>
              </tr>`).join('')
            : '<tr><td colspan="3" class="table-empty">No hay datos para el período seleccionado.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;

  renderChart('chart-mas-consumidos', {
    type: 'bar',
    data: {
      labels: data.map(d => d.nombre),
      datasets: [{
        label: 'Cantidad consumida',
        data: data.map(d => d.cantidad),
        backgroundColor: '#F97316',
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  panel.querySelector('#btn-descargar-csv').addEventListener('click', () => {
    descargarCSV(data, 'mas-consumidos.csv');
  });
}

function renderValorTotal(data, panel) {
  panel.innerHTML = `
    <div class="reporte-panel__header">
      <div>
        <h2 class="reporte-panel__title">Valor Total Consumido</h2>
        <p class="reporte-panel__subtitle">Sumatoria de todas las salidas en el período seleccionado</p>
      </div>
    </div>
    <div class="valor-total-display">
      <span class="valor-total-label">Total consumido en el período</span>
      <span class="valor-total-monto">Gs. ${formatearGs(data.total_gs)}</span>
    </div>
  `;
}

function renderProyeccionStock(data, panel) {
  function badgeEstado(estado) {
    const mapa = {
      critico: '<span class="badge badge--danger">Crítico</span>',
      bajo:    '<span class="badge badge--warning">Bajo</span>',
      ok:      '<span class="badge badge--success">OK</span>',
    };
    return mapa[estado] ?? estado;
  }

  panel.innerHTML = `
    <div class="reporte-panel__header">
      <div>
        <h2 class="reporte-panel__title">Proyección de Stock</h2>
        <p class="reporte-panel__subtitle">Estimación de días restantes según consumo de los últimos 30 días</p>
      </div>
    </div>
    <div class="reporte-tabla-container">
      <table class="table">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Stock Actual</th>
            <th>Consumo Diario</th>
            <th>Días Restantes</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.length
            ? data.map(d => `
              <tr>
                <td>${d.nombre}</td>
                <td>${d.stock_actual}</td>
                <td>${d.consumo_diario}</td>
                <td>${d.dias_restantes !== null ? d.dias_restantes : 'Sin datos'}</td>
                <td>${badgeEstado(d.estado)}</td>
              </tr>`).join('')
            : '<tr><td colspan="5" class="table-empty">No hay artículos para mostrar.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;
}

// ------------------------------------------------------------------
// Lógica principal
// ------------------------------------------------------------------

/**
 * Carga los datos del tab activo y renderiza el panel.
 * @param {string} tabKey
 * @param {HTMLElement} panel
 * @param {string} fechaDesde
 * @param {string} fechaHasta
 */
async function cargarTab(tabKey, panel, fechaDesde, fechaHasta) {
  // Destruir chart previo inmediatamente antes de limpiar el DOM
  if (chartActual) {
    chartActual.destroy();
    chartActual = null;
  }

  panel.innerHTML = createLoader('Cargando...');

  const params = { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };

  try {
    switch (tabKey) {
      case 'periodo': {
        const data = await reportesService.getConsumoPorPeriodo(params);
        renderConsumoPeriodo(data, panel);
        break;
      }
      case 'departamento': {
        const data = await reportesService.getConsumoPorDepartamento(params);
        renderConsumoDepartamento(data, panel);
        break;
      }
      case 'mas-consumidos': {
        const data = await reportesService.getMasConsumidos(params);
        renderMasConsumidos(data, panel);
        break;
      }
      case 'valor-total': {
        const data = await reportesService.getValorTotal(params);
        renderValorTotal(data, panel);
        break;
      }
      case 'proyeccion': {
        const data = await reportesService.getProyeccionStock();
        renderProyeccionStock(data, panel);
        break;
      }
      default:
        panel.innerHTML = '<p>Tab no reconocido.</p>';
    }
  } catch (err) {
    panel.innerHTML = '<p class="text-danger">Error al cargar el reporte.</p>';
    showToast('Error al cargar el reporte: ' + err.message, 'error');
  }
}

/**
 * Monta la página de reportes en el contenedor dado.
 * @param {HTMLElement} container
 */
export async function render(container) {
  // Fechas por defecto: últimos 30 días
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);

  const fechaHoyStr   = hoy.toISOString().slice(0, 10);
  const fecha30Str    = hace30.toISOString().slice(0, 10);

  container.innerHTML = `
    <div class="page reportes">
      <div class="page-header">
        <h1>Reportes y Análisis</h1>
        <p class="page-subtitle">Analizá el consumo de insumos por período, departamento y artículo.</p>
      </div>

      <div class="reportes-filtros">
        <div class="filtro-grupo">
          <label for="fecha-desde">Desde</label>
          <input type="date" id="fecha-desde" value="${fecha30Str}">
        </div>
        <div class="filtro-grupo">
          <label for="fecha-hasta">Hasta</label>
          <input type="date" id="fecha-hasta" value="${fechaHoyStr}">
        </div>
        <button id="btn-aplicar-filtro" class="btn btn-primary">Aplicar</button>
        <button id="btn-exportar-excel" class="btn btn-secondary">Descargar Excel</button>
      </div>

      <div class="reportes-tabs">
        <button class="tab-btn tab-btn--active" data-tab="periodo">Consumo por Período</button>
        <button class="tab-btn" data-tab="departamento">Por Departamento</button>
        <button class="tab-btn" data-tab="mas-consumidos">Más Consumidos</button>
        <button class="tab-btn" data-tab="valor-total">Valor Total</button>
        <button class="tab-btn" data-tab="proyeccion">Proyección de Stock</button>
      </div>

      <div id="reporte-panel" class="reporte-panel"></div>
    </div>
  `;

  const inputDesde    = container.querySelector('#fecha-desde');
  const inputHasta    = container.querySelector('#fecha-hasta');
  const btnAplicar    = container.querySelector('#btn-aplicar-filtro');
  const tabBtns       = container.querySelectorAll('.tab-btn');
  const panel         = container.querySelector('#reporte-panel');

  let tabActivo = 'periodo';

  // Cambio de tab
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      tabBtns.forEach(b => b.classList.remove('tab-btn--active'));
      btn.classList.add('tab-btn--active');
      tabActivo = btn.dataset.tab;
      await cargarTab(tabActivo, panel, inputDesde.value, inputHasta.value);
    });
  });

  // Aplicar filtro
  btnAplicar.addEventListener('click', async () => {
    await cargarTab(tabActivo, panel, inputDesde.value, inputHasta.value);
  });

  // Exportar Excel
  const btnExcel = container.querySelector('#btn-exportar-excel');
  btnExcel.addEventListener('click', () => {
    descargarExcel(inputDesde.value, inputHasta.value, btnExcel);
  });

  // Carga inicial
  await cargarTab(tabActivo, panel, inputDesde.value, inputHasta.value);
}
