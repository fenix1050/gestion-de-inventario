// =============================================================
// frontend/src/pages/articulos.js
// Página CRUD de artículos del catálogo.
// =============================================================

import {
  getArticulos,
  crearArticulo,
  actualizarArticulo,
  eliminarArticulo,
} from '../services/articulos.service.js';
import { authStore } from '../store/auth.store.js';
import { Toast } from '../components/Toast.js';
import { showModal, closeModal } from '../components/Modal.js';

let debounceTimer = null;
let abortController = null;

export const render = async (container) => {
  const esAdmin = authStore.user?.rol === 'admin';

  container.innerHTML = `
    <div class="page page--articulos">
      <div class="page__header">
        <h1>Catálogo de Artículos</h1>
        <button type="button" id="btn-volver" class="btn btn--secondary">Volver al Dashboard</button>
      </div>

      <div class="toolbar">
        <input
          type="search"
          id="input-buscar"
          class="input"
          placeholder="Buscar por nombre..."
          autocomplete="off"
        />
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
    renderTabla(cont, articulos || []);
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

    const acciones = esAdmin
      ? `
        <button type="button" class="btn btn--sm btn--secondary" data-action="editar" data-id="${art.id}">Editar</button>
        <button type="button" class="btn btn--sm btn--danger" data-action="eliminar" data-id="${art.id}" data-nombre="${escapeAttr(art.nombre)}">Eliminar</button>
      `
      : '';

    return `
      <tr>
        <td>${escapeAttr(art.codigo)}</td>
        <td>${escapeAttr(art.nombre)}</td>
        <td>${escapeAttr(art.categoria ?? '')}</td>
        <td>${formatGs(art.precio_unitario)}</td>
        <td>${stockCell}</td>
        <td class="acciones">${acciones}</td>
      </tr>
    `;
  }).join('');

  cont.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Acciones</th>
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

function abrirModalCrear() {
  showModal({
    title: 'Nuevo artículo',
    content: formHTML(),
    confirmText: 'Crear',
    onConfirm: () => submitForm({ modo: 'crear' }),
  });
}

function abrirModalEditar(art) {
  showModal({
    title: `Editar: ${escapeAttr(art.nombre)}`,
    content: formHTML(art),
    confirmText: 'Guardar',
    onConfirm: () => submitForm({ modo: 'editar', id: art.id }),
  });
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

function formHTML(art = {}) {
  // En edición NO incluimos stock_actual (lo controlan los triggers via ingresos/salidas)
  const esEdicion = !!art.id;
  return `
    <form id="form-articulo" class="form" novalidate>
      <label class="form__field">
        <span>Código *</span>
        <input name="codigo" type="text" required value="${escapeAttr(art.codigo ?? '')}">
      </label>
      <label class="form__field">
        <span>Nombre *</span>
        <input name="nombre" type="text" required value="${escapeAttr(art.nombre ?? '')}">
      </label>
      <label class="form__field">
        <span>Descripción</span>
        <input name="descripcion" type="text" maxlength="500" value="${escapeAttr(art.descripcion ?? '')}">
      </label>
      <label class="form__field">
        <span>Categoría</span>
        <input name="categoria" type="text" value="${escapeAttr(art.categoria ?? '')}">
      </label>
      <label class="form__field">
        <span>Precio unitario (Gs.) *</span>
        <input name="precio_unitario" type="number" min="0" step="1" required value="${art.precio_unitario ?? ''}">
      </label>
      <label class="form__field">
        <span>Stock mínimo *</span>
        <input name="stock_minimo" type="number" min="0" step="1" required value="${art.stock_minimo ?? 0}">
      </label>
      <label class="form__field">
        <span>Unidad de medida</span>
        <input name="unidad_medida" type="text" value="${escapeAttr(art.unidad_medida ?? 'unidad')}">
      </label>
      ${esEdicion ? '' : `
        <label class="form__field">
          <span>Stock inicial</span>
          <input name="stock_inicial" type="number" min="0" step="1" value="0">
        </label>
      `}
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

  const fd = new FormData(form);
  const data = {
    codigo:          fd.get('codigo').trim(),
    nombre:          fd.get('nombre').trim(),
    descripcion:     fd.get('descripcion')?.trim() || null,
    categoria:       fd.get('categoria')?.trim() || null,
    precio_unitario: Number(fd.get('precio_unitario')),
    stock_minimo:    Number(fd.get('stock_minimo')),
    unidad_medida:   fd.get('unidad_medida')?.trim() || 'unidad',
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
