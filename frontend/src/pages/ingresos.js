// =============================================================
// frontend/src/pages/ingresos.js
// Página de historial de ingresos al depósito.
// Botón "Registrar Ingreso" visible solo a operador y admin.
// =============================================================

import { getIngresos, crearIngreso } from '../services/ingresos.service.js';
import { getArticulos } from '../services/articulos.service.js';
import { authStore } from '../store/auth.store.js';
import { Toast } from '../components/Toast.js';
import { createLoader } from '../utils/loader.js';
import { showModal, closeModal } from '../components/Modal.js';

const LIMIT = 20;
let paginaActual = 0;

export const render = async (container) => {
  const rol = authStore.user?.rol;
  const puedeRegistrar = rol === 'operador' || rol === 'admin';

  container.innerHTML = `
    <div class="page page--ingresos">
      <div class="page__header">
        <h1>Ingresos al Depósito</h1>
        <div class="page__header-actions">
          ${puedeRegistrar
            ? `<button type="button" id="btn-nuevo-ingreso" class="btn btn--primary">Registrar Ingreso</button>`
            : ''}
        </div>
      </div>

      <div class="table-wrapper">
        <div id="ingresos-container">${createLoader('Cargando ingresos...')}</div>
      </div>

      <div id="paginacion-ingresos" class="pagination"></div>
    </div>
  `;

  if (puedeRegistrar) {
    document.getElementById('btn-nuevo-ingreso')
      .addEventListener('click', abrirDrawer);
  }

  paginaActual = 0;
  await cargarIngresos();
};

async function cargarIngresos() {
  const cont = document.getElementById('ingresos-container');
  if (!cont) return;

  try {
    const data = await getIngresos({ limit: LIMIT, offset: paginaActual * LIMIT });
    renderTabla(cont, data || []);
    renderPaginacion(data || []);
  } catch (err) {
    cont.innerHTML = `<p class="error-message">Error: ${err.message}</p>`;
  }
}

function renderTabla(cont, ingresos) {
  if (ingresos.length === 0) {
    cont.innerHTML = `<p class="empty-state">No hay ingresos registrados.</p>`;
    return;
  }

  const filas = ingresos.map((ing) => `
    <tr>
      <td>${formatFecha(ing.fecha)}</td>
      <td>${escapeHtml(ing.articulo?.nombre ?? '—')}</td>
      <td>${ing.cantidad}</td>
      <td>${escapeHtml(ing.proveedor_nombre ?? '—')}</td>
      <td>${ing.precio_unitario != null ? formatGs(ing.precio_unitario) : '—'}</td>
      <td>${ing.referencia ?? '—'}</td>
    </tr>
  `).join('');

  cont.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Artículo</th>
          <th>Cantidad</th>
          <th>Proveedor</th>
          <th>Precio Unit.</th>
          <th>N° Factura</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function renderPaginacion(ingresos) {
  const cont = document.getElementById('paginacion-ingresos');
  if (!cont) return;

  const hayAnterior = paginaActual > 0;
  const haySiguiente = ingresos.length === LIMIT;

  if (!hayAnterior && !haySiguiente) {
    cont.innerHTML = '';
    return;
  }

  cont.innerHTML = `
    <button type="button" id="btn-anterior" class="btn btn--secondary" ${hayAnterior ? '' : 'disabled'}>Anterior</button>
    <span class="pagination__info">Página ${paginaActual + 1}</span>
    <button type="button" id="btn-siguiente" class="btn btn--secondary" ${haySiguiente ? '' : 'disabled'}>Siguiente</button>
  `;

  if (hayAnterior) {
    document.getElementById('btn-anterior').addEventListener('click', () => {
      paginaActual--;
      cargarIngresos();
    });
  }
  if (haySiguiente) {
    document.getElementById('btn-siguiente').addEventListener('click', () => {
      paginaActual++;
      cargarIngresos();
    });
  }
}

async function abrirDrawer() {
  // Deshabilitar el botón mientras se cargan los selects
  const btnNuevo = document.getElementById('btn-nuevo-ingreso');
  if (btnNuevo) btnNuevo.disabled = true;

  let articulos = [];

  try {
    articulos = await getArticulos();
  } catch (err) {
    Toast.error('No se pudieron cargar los datos del formulario.');
    if (btnNuevo) btnNuevo.disabled = false;
    return;
  }

  if (btnNuevo) btnNuevo.disabled = false;

  showModal({
    title: 'Registrar Ingreso',
    variant: 'drawer',
    content: formHTML({ articulos }),
    confirmText: 'Registrar',
    onConfirm: () => submitForm(),
  });

  wireFormPrecio();
}

function formHTML({ articulos }) {
  const optsArticulos = articulos.map(a =>
    `<option value="${a.id}">${escapeHtml(a.codigo)} — ${escapeHtml(a.nombre)}</option>`
  ).join('');

  return `
    <form id="form-ingreso" class="form-grid" novalidate>

      <label class="form__field form__field--full">
        <span>Artículo *</span>
        <select name="articulo_id" required>
          <option value="">Seleccioná un artículo</option>
          ${optsArticulos}
        </select>
      </label>

      <label class="form__field">
        <span>Cantidad *</span>
        <input name="cantidad" type="number" min="1" step="1" required placeholder="0">
      </label>

      <label class="form__field">
        <span>Precio Unitario (Gs.)</span>
        <input name="precio_unitario" type="text" inputmode="numeric" placeholder="Opcional" data-precio>
      </label>

      <label class="form__field form__field--full">
        <span>Proveedor</span>
        <input name="proveedor_nombre" type="text" maxlength="100" placeholder="Nombre del proveedor (opcional)">
      </label>

      <label class="form__field">
        <span>N° Factura</span>
        <input name="referencia" type="text" maxlength="50" placeholder="Opcional">
      </label>

      <label class="form__field form__field--full">
        <span>Observaciones</span>
        <textarea name="observaciones" maxlength="500" placeholder="Opcional"></textarea>
      </label>

    </form>
  `;
}

async function submitForm() {
  const form = document.getElementById('form-ingreso');
  if (!form) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const fd = new FormData(form);

  const payload = {
    articulo_id: fd.get('articulo_id'),
    cantidad:    parseInt(fd.get('cantidad'), 10),
  };

  const proveedor_nombre = fd.get('proveedor_nombre')?.trim();
  const precioRaw        = fd.get('precio_unitario')?.replace(/\./g, '').replace(/\s/g, '') ?? '';
  const referencia       = fd.get('referencia')?.trim();
  const observaciones    = fd.get('observaciones')?.trim();

  if (proveedor_nombre)          payload.proveedor_nombre = proveedor_nombre;
  if (precioRaw !== '')          payload.precio_unitario  = Number(precioRaw);
  if (referencia)                  payload.referencia  = referencia;
  if (observaciones)                   payload.observaciones   = observaciones;

  const submitBtn = document.querySelector('#modal-container button[data-action="confirm"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';
  }

  try {
    const result = await crearIngreso(payload);
    closeModal();
    Toast.success(`Ingreso registrado. Stock actual: ${result.stock_actual}`);
    paginaActual = 0;
    cargarIngresos();
  } catch (err) {
    Toast.error(err.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrar';
    }
  }
}

// ------- Utilidades locales -------

function formatFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatGs(n) {
  return `Gs. ${Number(n).toLocaleString('es-PY')}`;
}

function wireFormPrecio() {
  const input = document.querySelector('input[data-precio]');
  if (!input) return;
  input.addEventListener('input', () => {
    const soloDigitos = input.value.replace(/\D/g, '');
    const num = parseInt(soloDigitos, 10);
    input.value = isNaN(num) ? '' : num.toLocaleString('es-PY');
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
