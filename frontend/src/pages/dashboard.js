// =============================================================
// frontend/src/pages/dashboard.js
// Página principal — Dashboard con estadísticas y gráficos
// =============================================================

import { getArticulos } from '../services/articulos.service.js';
import { getHistorial } from '../services/historial.service.js';

// Formatea un número como guaraníes (Gs. X.XXX.XXX)
function formatGs(valor) {
  return 'Gs. ' + Math.round(valor).toLocaleString('es-PY');
}

// Formatea una fecha ISO como DD/MM/YYYY
function formatFecha(fechaISO) {
  if (!fechaISO) return '—';
  const d = new Date(fechaISO);
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Devuelve true si la fecha ISO corresponde al día de hoy (comparación local)
function esHoy(fechaISO) {
  if (!fechaISO) return false;
  const hoy = new Date();
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return fechaISO.slice(0, 10) === hoyStr;
}

// Construye el HTML del badge de estado de stock
function badgeStock(stockActual, stockMinimo) {
  if (stockActual === 0) return '<span class="stock-badge badge-sin-stock">Sin Stock</span>';
  if (stockActual <= stockMinimo) return '<span class="stock-badge badge-bajo">Stock Bajo</span>';
  return '<span class="stock-badge badge-normal">Normal</span>';
}

export const render = async (container) => {
  // Estado de carga
  container.innerHTML = '<div class="loader-container">Cargando...</div>';

  let articulos = [];
  let historial = [];

  try {
    [articulos, historial] = await Promise.all([
      getArticulos(),
      getHistorial({ limit: 50 }),
    ]);

    articulos = articulos || [];
    historial = historial || [];
  } catch (err) {
    container.innerHTML = `<div class="dashboard-error">Error al cargar el dashboard: ${err.message}</div>`;
    return;
  }

  // ---- Cálculo de stat cards ----
  const totalArticulos = articulos.length;

  const valorTotal = articulos.reduce((acc, a) => {
    return acc + (a.precio_unitario || 0) * (a.stock_actual || 0);
  }, 0);

  const movimientosHoy = historial.filter(m => esHoy(m.fecha)).length;

  const alertasStock = articulos.filter(a => (a.stock_actual || 0) <= (a.stock_minimo || 0)).length;

  // ---- Estado del stock — 5 artículos más críticos ----
  const articulosOrdenados = [...articulos]
    .sort((a, b) => (a.stock_actual || 0) - (b.stock_actual || 0))
    .slice(0, 5);

  const stockItemsHTML = articulosOrdenados.length
    ? articulosOrdenados.map(a => `
        <div class="stock-item">
          <div>
            <div class="stock-item-nombre">${a.nombre}</div>
            <div class="stock-item-detalle">Stock: ${a.stock_actual} / Mínimo: ${a.stock_minimo}</div>
          </div>
          ${badgeStock(a.stock_actual, a.stock_minimo)}
        </div>
      `).join('')
    : '<p class="dashboard-empty">No hay artículos registrados</p>';

  // ---- Consumo por departamento — top 5 salidas ----
  const salidas = historial.filter(m => m.tipo === 'salida');
  const consumoPorDep = {};
  for (const s of salidas) {
    const dep = s.departamento_nombre || 'Sin departamento';
    consumoPorDep[dep] = (consumoPorDep[dep] || 0) + (s.cantidad || 0);
  }
  const topDepartamentos = Object.entries(consumoPorDep)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxConsumo = topDepartamentos.length ? topDepartamentos[0][1] : 1;

  const barChartHTML = topDepartamentos.length
    ? topDepartamentos.map(([dep, cantidad]) => {
        const alturaPct = Math.max(4, Math.round((cantidad / maxConsumo) * 100));
        return `
          <div class="bar-chart-item">
            <div class="bar" style="height: ${alturaPct}%;" title="${dep}: ${cantidad}"></div>
            <div class="bar-label" title="${dep}">${dep}</div>
          </div>
        `;
      }).join('')
    : '<p class="dashboard-empty">Sin datos de consumo</p>';

  // ---- Movimientos recientes — últimos 10 ----
  const movimientosRecientes = historial.slice(0, 10);

  const movimientosHTML = movimientosRecientes.length
    ? `
      <table class="movimientos-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Artículo</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          ${movimientosRecientes.map(m => `
            <tr>
              <td>${formatFecha(m.fecha)}</td>
              <td>
                ${m.tipo === 'entrada'
                  ? '<span class="badge-entrada">Entrada</span>'
                  : '<span class="badge-salida">Salida</span>'}
              </td>
              <td>${m.articulo_nombre || '—'}</td>
              <td>${m.tipo === 'entrada' ? '+' : '-'}${m.cantidad}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
    : '<p class="dashboard-empty">No hay movimientos recientes</p>';

  // ---- Alertas de stock bajo ----
  const articulosConAlerta = articulos.filter(a => (a.stock_actual || 0) <= (a.stock_minimo || 0));

  const alertasHTML = articulosConAlerta.length
    ? articulosConAlerta.map(a => `
        <div class="stock-item">
          <div>
            <div class="stock-item-nombre">${a.nombre}</div>
            <div class="stock-item-detalle">Stock: ${a.stock_actual} / Mínimo: ${a.stock_minimo}</div>
          </div>
          ${badgeStock(a.stock_actual, a.stock_minimo)}
        </div>
      `).join('')
    : '<p class="dashboard-empty">No hay artículos con stock bajo</p>';

  // ---- Render final ----
  container.innerHTML = `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="dashboard-subtitle">Resumen general del inventario</p>
      </div>

      <!-- Stat cards -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-label">Total de Artículos</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div class="stat-card-value">${totalArticulos}</div>
          <div class="stat-card-sub">Artículos registrados</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-label">Valor Total</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-card-value">${formatGs(valorTotal)}</div>
          <div class="stat-card-sub">Valor del inventario</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-card-label">Movimientos Hoy</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div class="stat-card-value">${movimientosHoy}</div>
          <div class="stat-card-sub">Transacciones del día</div>
        </div>
        <div class="stat-card ${alertasStock > 0 ? 'stat-card--alerta' : ''}">
          <div class="stat-card-top">
            <span class="stat-card-label">Alertas de Stock</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="stat-card-value">${alertasStock}</div>
          <div class="stat-card-sub">Artículos con stock bajo</div>
        </div>
      </div>

      <!-- Fila 1: Estado del stock + Consumo por departamento -->
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="dashboard-card-title">Estado del Stock</div>
          <div class="dashboard-card-subtitle">Artículos más críticos (menor stock primero)</div>
          ${stockItemsHTML}
          <button class="dashboard-link-btn" data-route="#/articulos">Ver todos los artículos →</button>
        </div>

        <div class="dashboard-card">
          <div class="dashboard-card-title">Consumo por Departamento</div>
          <div class="dashboard-card-subtitle">Top 5 departamentos por cantidad de salidas</div>
          <div class="bar-chart">
            ${barChartHTML}
          </div>
        </div>
      </div>

      <!-- Fila 2: Movimientos recientes + Alertas -->
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="dashboard-card-title">Movimientos Recientes</div>
          <div class="dashboard-card-subtitle">Últimos 10 movimientos registrados</div>
          ${movimientosHTML}
          <button class="dashboard-link-btn" data-route="#/historial">Ver historial completo →</button>
        </div>

        <div class="dashboard-card">
          <div class="dashboard-card-title">Alertas de Stock Bajo</div>
          <div class="dashboard-card-subtitle">Artículos en o por debajo del stock mínimo</div>
          ${alertasHTML}
        </div>
      </div>
    </div>
  `;

  // Vincular botones de navegación
  container.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.dataset.route;
    });
  });
};
