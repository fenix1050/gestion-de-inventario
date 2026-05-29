// =============================================================
// frontend/src/pages/dashboard.js
// Página principal — Dashboard con estadísticas y gráficos
// =============================================================

import { authStore } from '../store/auth.store.js';
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
  const fecha = new Date(fechaISO);
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

// Construye el HTML del badge de estado de stock
function badgeStock(stockActual, stockMinimo) {
  if (stockActual === 0) return '<span class="stock-badge badge-sin-stock">Sin Stock</span>';
  if (stockActual <= stockMinimo) return '<span class="stock-badge badge-bajo">Stock Bajo</span>';
  return '<span class="stock-badge badge-normal">Normal</span>';
}

export const render = async (container) => {
  const user = authStore.user;
  const nombreUsuario = user?.nombre || user?.email || 'Usuario';
  const rol = user?.rol || '—';

  // Estado de carga
  container.innerHTML = '<div class="loader-container">Cargando...</div>';

  let articulos = [];
  let historial = [];

  try {
    const [resArticulos, resHistorial] = await Promise.all([
      getArticulos(),
      getHistorial({ limit: 50 }),
    ]);

    if (resArticulos.success) articulos = resArticulos.data || [];
    if (resHistorial.success) historial = resHistorial.data || [];
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
        <p>Bienvenido/a, <strong>${nombreUsuario}</strong> · <span class="badge-rol">${rol}</span></p>
      </div>

      <!-- Stat cards -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-card-icon">📦</div>
          <div class="stat-card-value">${totalArticulos}</div>
          <div class="stat-card-label">Total de Artículos</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">$</div>
          <div class="stat-card-value">${formatGs(valorTotal)}</div>
          <div class="stat-card-label">Valor Total en Stock</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">↗</div>
          <div class="stat-card-value">${movimientosHoy}</div>
          <div class="stat-card-label">Movimientos Hoy</div>
        </div>
        <div class="stat-card stat-card--alerta">
          <div class="stat-card-icon">⚠</div>
          <div class="stat-card-value">${alertasStock}</div>
          <div class="stat-card-label">Alertas de Stock</div>
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
