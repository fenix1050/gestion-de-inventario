// =============================================================
// frontend/src/pages/articulos.js
// Página CRUD de artículos del catálogo.
// =============================================================

import {
  getArticulos,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
  getSiguienteCodigo,
} from '../services/articulos.service.js';
import { authStore } from '../store/auth.store.js';
import { Toast } from '../components/Toast.js';
import { showModal, closeModal } from '../components/Modal.js';

let debounceTimer = null;
let abortController = null;
let articulosCargados = [];

export const render = async (container) => {
  const esAdmin = authStore.user?.rol === 'admin';

  container.innerHTML = `
    <div class="page page--articulos">
      <div class="page__header">
        <h1>Catálogo de Artículos</h1>
        <button type="button" id="btn-volver" class="btn btn--secondary">Volver al Dashboard</button>
      </div>

      <div class="toolbar">
        <div class="toolbar__search">
          <input
            type="search"
            id="input-buscar"
            class="input"
            placeholder="Buscar por código o nombre..."
            autocomplete="off"
          />
          <button type="button" id="btn-actualizar" class="btn btn--primary">Actualizar</button>
        </div>
        ${esAdmin
          ? `<button type="button" id="btn-nuevo" class="btn btn--primary">Nuevo artículo</button>`
          : ''
        }
      </div>

      <div class="table-wrapper">
        <div id="articulos-container">Cargando artículos...</div>
      </div>
    </div>
  `;

  document.getElementById('btn-volver')
    .addEventListener('click', () => { window.location.hash = '#/dashboard'; });

  const inputBuscar = document.getElementById('input-buscar');
  inputBuscar.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => cargarArticulos(value), 400);
  });

  document.getElementById('btn-actualizar').addEventListener('click', () => {
    inputBuscar.value = '';
    clearTimeout(debounceTimer);
    cargarArticulos();
  });

  if (esAdmin) {
    document.getElementById('btn-nuevo')
      .addEventListener('click', abrirModalCrear);
  }

  await cargarArticulos();
};

async function cargarArticulos(search = '') {
  // Cancelar petición anterior en vuelo
  if (abortController) abortController.abort();
  abortController = new AbortController();

  const cont = document.getElementById('articulos-container');
  if (!cont) return;

  try {
    const articulos = await getArticulos({
      search: search || undefined,
      signal: abortController.signal,
    });
    articulosCargados = articulos || [];
    renderTabla(cont, articulosCargados);
  } catch (err) {
    if (err.name === 'AbortError') return;
    cont.innerHTML = `<p class="error-message">Error: ${err.message}</p>`;
  }
}

function renderTabla(cont, articulos) {
  const esAdmin = authStore.user?.rol === 'admin';

  if (articulos.length === 0) {
    cont.innerHTML = `<p class="empty-state">No se encontraron artículos.</p>`;
    return;
  }

  const filas = articulos.map((art) => {
    const stockBajo = art.stock_actual <= art.stock_minimo;
    const stockCell = stockBajo
      ? `<span class="badge badge--danger">${art.stock_actual} Bajo</span>`
      : `<span class="badge badge--success">${art.stock_actual}</span>`;

    return `
      <tr>
        <td>${escapeAttr(art.codigo)}</td>
        <td>${escapeAttr(art.nombre)}</td>
        <td>${formatGs(art.precio_unitario)}</td>
        <td>${stockCell}</td>
        ${esAdmin ? `
        <td class="acciones">
          <button type="button" class="btn-icon btn-icon--edit" data-action="editar" data-id="${art.id}" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button type="button" class="btn-icon btn-icon--delete" data-action="eliminar" data-id="${art.id}" data-nombre="${escapeAttr(art.nombre)}" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </td>` : ''}
      </tr>
    `;
  }).join('');

  cont.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Stock</th>
          ${esAdmin ? '<th>Acciones</th>' : ''}
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;

  if (esAdmin) wireAcciones(cont, articulos);
}

function wireAcciones(cont, articulos) {
  // Un solo listener en el tbody para todos los botones (event delegation)
  cont.querySelector('tbody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const accion = btn.dataset.action;

    if (accion === 'editar') {
      const art = articulos.find((a) => String(a.id) === String(id));
      if (art) abrirModalEditar(art);
    } else if (accion === 'eliminar') {
      confirmarEliminar(id, btn.dataset.nombre);
    }
  });
}

// ------- Modales CRUD -------

async function abrirModalCrear() {
  const { codigo: codSugerido } = await getSiguienteCodigo();

  showModal({
    title: 'Nuevo Artículo',
    subtitle: 'Completá los datos para registrar un nuevo producto.',
    variant: 'drawer',
    content: formHTML({ codSugerido }),
    confirmText: 'Crear Artículo',
    onConfirm: () => submitForm({ modo: 'crear' }),
  });

  wireFormPrecio();

  // Wiring de radio buttons de código (el DOM ya existe tras showModal)
  document.querySelectorAll('input[name="modo_codigo"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const inputCodigo = document.getElementById('input-codigo');
      if (!inputCodigo) return;
      if (radio.value === 'manual') {
        inputCodigo.disabled = false;
        inputCodigo.value = '';
        inputCodigo.focus();
      } else {
        inputCodigo.disabled = true;
        inputCodigo.value = codSugerido;
      }
    });
  });
}

function abrirModalEditar(art) {
  showModal({
    title: 'Editar Artículo',
    subtitle: 'Modifica la información y detalles del artículo.',
    variant: 'drawer',
    content: formHTML(art),
    confirmText: 'Guardar Cambios',
    onConfirm: () => submitForm({ modo: 'editar', id: art.id }),
  });
  wireFormPrecio();
}

function confirmarEliminar(id, nombre) {
  showModal({
    variant: 'confirm',
    title: 'Eliminar artículo',
    content: `<p>¿Seguro que querés eliminar <strong>${nombre}</strong>? Esta acción puede revertirse desde la base de datos.</p>`,
    confirmText: 'Eliminar',
    onConfirm: async () => {
      try {
        await eliminarArticulo(id);
        closeModal();
        Toast.success('Artículo eliminado.');
        cargarArticulos(document.getElementById('input-buscar')?.value.trim() || '');
      } catch (err) {
        Toast.error(err.message);
      }
    },
  });
}

// ------- Form helpers -------


const UNIDADES = ['unidad', 'caja', 'resma', 'rollo', 'paquete', 'litro', 'par'];

function formatearMonto(n) {
  const num = typeof n === 'string' ? parseInt(n.replace(/\./g, ''), 10) : n;
  if (isNaN(num)) return '';
  return num.toLocaleString('es-PY');
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

function formHTML(art = {}) {
  const esEdicion = !!art.id;
  const codSugerido = esEdicion ? null : (art.codSugerido ?? null);

  const optsUnd = UNIDADES.map(u =>
    `<option value="${u}" ${(art.unidad_medida ?? 'unidad') === u ? 'selected' : ''}>${u.charAt(0).toUpperCase() + u.slice(1)}</option>`
  ).join('');

  return `
    <form id="form-articulo" class="form-grid" novalidate>

      ${esEdicion ? `
      <label class="form__field">
        <span>Código *</span>
        <input name="codigo" type="text" required value="${escapeAttr(art.codigo ?? '')}" placeholder="ART-001">
      </label>
      ` : `
      <div class="codigo-gen form__field--full">
        <p class="codigo-gen__title">Generación de Código</p>
        <div class="codigo-gen__options">
          <label class="codigo-gen__option">
            <input type="radio" name="modo_codigo" value="auto" checked>
            <span>Generar automáticamente</span>
            <span class="codigo-gen__sugerido">(${codSugerido})</span>
          </label>
          <label class="codigo-gen__option">
            <input type="radio" name="modo_codigo" value="manual">
            <span>Ingresar manualmente</span>
          </label>
        </div>
        <input id="input-codigo" name="codigo" type="text" required
          value="${codSugerido}" style="margin-top:0.75rem" disabled
          placeholder="ART-001">
      </div>
      `}

      <label class="form__field">
        <span>Nombre *</span>
        <input name="nombre" type="text" required value="${escapeAttr(art.nombre ?? '')}" placeholder="Nombre del artículo">
      </label>

      <label class="form__field form__field--full">
        <span>Descripción</span>
        <textarea name="descripcion" maxlength="500" placeholder="Descripción opcional">${escapeAttr(art.descripcion ?? '')}</textarea>
      </label>

      <label class="form__field">
        <span>Precio Unit. (Gs.) *</span>
        <input name="precio_unitario" type="text" inputmode="numeric" required
          value="${art.precio_unitario ? formatearMonto(art.precio_unitario) : ''}"
          placeholder="0" data-precio>
      </label>

      <label class="form__field">
        <span>Unidad *</span>
        <select name="unidad_medida">${optsUnd}</select>
      </label>

      ${esEdicion ? '' : `
      <label class="form__field">
        <span>Stock Inicial</span>
        <input name="stock_inicial" type="number" min="0" step="1" value="0">
      </label>
      `}

      <label class="form__field ${esEdicion ? '' : ''}">
        <span>Stock Mínimo *</span>
        <input name="stock_minimo" type="number" min="0" step="1" required value="${art.stock_minimo ?? 0}">
      </label>

      <p class="form__hint" data-role="form-error" hidden></p>
    </form>
  `;
}

async function submitForm({ modo, id }) {
  const form = document.getElementById('form-articulo');
  if (!form) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Los inputs disabled no entran en FormData — habilitar código antes de leer
  const inputCodigo = form.querySelector('input[name="codigo"]');
  if (inputCodigo) inputCodigo.disabled = false;

  const fd = new FormData(form);
  const data = {
    codigo:          fd.get('codigo')?.trim(),
    nombre:          fd.get('nombre').trim(),
    descripcion:     fd.get('descripcion')?.trim() || null,
    precio_unitario: parseInt((fd.get('precio_unitario') ?? '').replace(/\./g, ''), 10) || 0,
    stock_minimo:    Number(fd.get('stock_minimo')),
    unidad_medida:   fd.get('unidad_medida') || 'unidad',
  };

  if (modo === 'crear') {
    data.stock_inicial = Number(fd.get('stock_inicial') ?? 0);
  }

  const submitBtn = document.querySelector('#modal-container button[data-action="confirm"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }

  try {
    if (modo === 'crear') {
      await crearArticulo(data);
      Toast.success('Artículo creado correctamente.');
    } else {
      await actualizarArticulo(id, data);
      Toast.success('Artículo actualizado.');
    }
    closeModal();
    cargarArticulos(document.getElementById('input-buscar')?.value.trim() || '');
  } catch (err) {
    Toast.error(err.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = modo === 'crear' ? 'Crear' : 'Guardar';
    }
  }
}

// ------- Utilidades locales -------

function formatGs(n) {
  if (n == null) return '';
  return `Gs. ${Number(n).toLocaleString('es-PY')}`;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
