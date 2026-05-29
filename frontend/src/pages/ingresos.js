// =============================================================
// frontend/src/pages/ingresos.js
// Página de historial de ingresos al depósito.
// Botón "Registrar Ingreso" visible solo a operador y admin.
// =============================================================

import { getIngresos, crearIngreso, actualizarIngreso, eliminarIngreso } from '../services/ingresos.service.js';
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
  const puedeEditar = ['operador', 'admin'].includes(authStore.user?.rol);

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
      ${puedeEditar ? `
      <td class="acciones">
        <button type="button" class="btn-icon btn-icon--edit" data-action="editar" data-id="${ing.id}" title="Editar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button type="button" class="btn-icon btn-icon--delete" data-action="eliminar" data-id="${ing.id}" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </td>` : ''}
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
          ${puedeEditar ? '<th>Acciones</th>' : ''}
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;

  if (puedeEditar) wireAcciones(cont, ingresos);
}

function wireAcciones(cont, ingresos) {
  cont.querySelector('tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'editar') {
      const ing = ingresos.find((i) => String(i.id) === String(id));
      if (ing) abrirDrawerEditar(ing);
    } else if (btn.dataset.action === 'eliminar') {
      confirmarEliminar(id);
    }
  });
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

function formHTML({ articulos, ingreso = null }) {
  const esEdicion = !!ingreso;

  const optsArticulos = articulos.map(a => {
    const sel = esEdicion && ingreso.articulo?.id === a.id ? 'selected' : '';
    return `<option value="${a.id}" ${sel}>${escapeHtml(a.codigo)} — ${escapeHtml(a.nombre)}</option>`;
  }).join('');

  const precioFormateado = ingreso?.precio_unitario != null
    ? Number(ingreso.precio_unitario).toLocaleString('es-PY')
    : '';

  return `
    <form id="form-ingreso" class="form-grid" novalidate>

      <label class="form__field form__field--full">
        <span>Artículo *</span>
        <select name="articulo_id" required ${esEdicion ? 'disabled' : ''}>
          <option value="">Seleccioná un artículo</option>
          ${optsArticulos}
        </select>
        ${esEdicion ? `<input type="hidden" name="articulo_id" value="${ingreso.articulo?.id ?? ''}">` : ''}
      </label>

      <label class="form__field">
        <span>Cantidad *</span>
        <input name="cantidad" type="number" min="1" step="1" required placeholder="0" value="${ingreso?.cantidad ?? ''}">
      </label>

      <label class="form__field">
        <span>Precio Unitario (Gs.)</span>
        <input name="precio_unitario" type="text" inputmode="numeric" placeholder="Opcional" data-precio value="${precioFormateado}">
      </label>

      <label class="form__field form__field--full">
        <span>Proveedor</span>
        <input name="proveedor_nombre" type="text" maxlength="100" placeholder="Nombre del proveedor (opcional)" value="${escapeHtml(ingreso?.proveedor_nombre ?? '')}">
      </label>

      <label class="form__field">
        <span>N° Factura</span>
        <input name="referencia" type="text" maxlength="50" placeholder="Opcional" value="${escapeHtml(ingreso?.referencia ?? '')}">
      </label>

      <label class="form__field form__field--full">
        <span>Observaciones</span>
        <textarea name="observaciones" maxlength="500" placeholder="Opcional">${escapeHtml(ingreso?.observaciones ?? '')}</textarea>
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

async function abrirDrawerEditar(ing) {
  let articulos = [];
  try {
    articulos = await getArticulos();
  } catch {
    Toast.error('No se pudieron cargar los artículos.');
    return;
  }

  showModal({
    title: 'Editar Ingreso',
    variant: 'drawer',
    content: formHTML({ articulos, ingreso: ing }),
    confirmText: 'Guardar Cambios',
    onConfirm: () => submitFormEditar(ing.id),
  });

  wireFormPrecio();
}

function submitFormEditar(id) {
  const form = document.getElementById('form-ingreso');
  if (!form || !form.checkValidity()) {
    form?.reportValidity();
    return;
  }

  const fd = new FormData(form);
  const payload = {};

  const cantidad = parseInt(fd.get('cantidad'), 10);
  if (!isNaN(cantidad)) payload.cantidad = cantidad;

  const precioRaw = fd.get('precio_unitario')?.replace(/\./g, '').replace(/\s/g, '') ?? '';
  if (precioRaw !== '') payload.precio_unitario = Number(precioRaw);

  const proveedor_nombre = fd.get('proveedor_nombre')?.trim();
  if (proveedor_nombre !== undefined) payload.proveedor_nombre = proveedor_nombre || null;

  const referencia = fd.get('referencia')?.trim();
  if (referencia !== undefined) payload.referencia = referencia || null;

  const observaciones = fd.get('observaciones')?.trim();
  if (observaciones !== undefined) payload.observaciones = observaciones || null;

  const submitBtn = document.querySelector('#modal-container button[data-action="confirm"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Guardando...'; }

  actualizarIngreso(id, payload)
    .then((result) => {
      closeModal();
      Toast.success(`Ingreso actualizado. Stock actual: ${result.data?.stock_actual ?? '—'}`);
      cargarIngresos();
    })
    .catch((err) => {
      Toast.error(err.message);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar Cambios'; }
    });
}

function confirmarEliminar(id) {
  showModal({
    variant: 'confirm',
    title: 'Eliminar ingreso',
    content: `<p>¿Seguro que querés eliminar este ingreso? El stock del artículo se <strong>recalculará automáticamente</strong>.</p>`,
    confirmText: 'Eliminar',
    onConfirm: async () => {
      try {
        const result = await eliminarIngreso(id);
        closeModal();
        Toast.success(`Ingreso eliminado. Stock actual: ${result.data?.stock_actual ?? '—'}`);
        cargarIngresos();
      } catch (err) {
        Toast.error(err.message);
      }
    },
  });
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
