// =============================================================
// frontend/src/pages/salidas.js
// Página de historial de salidas del depósito.
// Botón "Registrar Salida" visible solo a operador y admin.
// =============================================================

import { getSalidas, crearSalida } from '../services/salidas.service.js';
import { getArticulos } from '../services/articulos.service.js';
import { getDepartamentos } from '../services/departamentos.service.js';
import { getUsuarios } from '../services/usuarios.service.js';
import { authStore } from '../store/auth.store.js';
import { Toast } from '../components/Toast.js';
import { showModal, closeModal } from '../components/Modal.js';

const LIMIT = 20;
let paginaActual = 1;

export const render = async (container) => {
  const rol = authStore.user?.rol;
  const puedeRegistrar = rol === 'operador' || rol === 'admin';

  container.innerHTML = `
    <div class="page page--salidas">
      <div class="page__header">
        <h1>Salidas del Depósito</h1>
        <div class="page__header-actions">
          <button type="button" id="btn-volver" class="btn btn--secondary">Volver al Dashboard</button>
          ${puedeRegistrar
            ? `<button type="button" id="btn-nueva-salida" class="btn btn--primary">Registrar Salida</button>`
            : ''}
        </div>
      </div>

      <div class="table-wrapper">
        <div id="salidas-container">Cargando salidas...</div>
      </div>

      <div id="paginacion-salidas" class="pagination"></div>
    </div>
  `;

  document.getElementById('btn-volver')
    .addEventListener('click', () => { window.location.hash = '#/dashboard'; });

  if (puedeRegistrar) {
    document.getElementById('btn-nueva-salida')
      .addEventListener('click', abrirDrawer);
  }

  paginaActual = 1;
  await cargarSalidas();
};

async function cargarSalidas() {
  const cont = document.getElementById('salidas-container');
  if (!cont) return;

  try {
    const data = await getSalidas({ page: paginaActual, limit: LIMIT });
    renderTabla(cont, data || []);
    renderPaginacion(data || []);
  } catch (err) {
    cont.innerHTML = `<p class="error-message">Error: ${err.message}</p>`;
  }
}

function renderTabla(cont, salidas) {
  if (salidas.length === 0) {
    cont.innerHTML = `<p class="empty-state">No hay salidas registradas.</p>`;
    return;
  }

  const filas = salidas.map((sal) => `
    <tr>
      <td>${formatFecha(sal.fecha)}</td>
      <td>${escapeHtml(sal.articulo?.nombre ?? '—')}</td>
      <td>${sal.cantidad}</td>
      <td>${escapeHtml(sal.departamento?.nombre ?? '—')}</td>
      <td>${escapeHtml(sal.colaborador_id ?? '—')}</td>
      <td>${escapeHtml(sal.usuario_id ?? '—')}</td>
    </tr>
  `).join('');

  cont.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Artículo</th>
          <th>Cantidad</th>
          <th>Departamento</th>
          <th>Colaborador</th>
          <th>Registrado por</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function renderPaginacion(salidas) {
  const cont = document.getElementById('paginacion-salidas');
  if (!cont) return;

  const hayAnterior = paginaActual > 1;
  const haySiguiente = salidas.length === LIMIT;

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
      cargarSalidas();
    });
  }
  if (haySiguiente) {
    document.getElementById('btn-siguiente').addEventListener('click', () => {
      paginaActual++;
      cargarSalidas();
    });
  }
}

async function abrirDrawer() {
  // Deshabilitar el botón mientras se cargan los selects
  const btnNuevo = document.getElementById('btn-nueva-salida');
  if (btnNuevo) btnNuevo.disabled = true;

  let articulos = [];
  let departamentos = [];
  let usuarios = [];

  try {
    [articulos, departamentos, usuarios] = await Promise.all([
      getArticulos(),
      getDepartamentos(),
      getUsuarios(),
    ]);
  } catch (err) {
    Toast.error('No se pudieron cargar los datos del formulario.');
    if (btnNuevo) btnNuevo.disabled = false;
    return;
  }

  if (btnNuevo) btnNuevo.disabled = false;

  showModal({
    title: 'Registrar Salida',
    variant: 'drawer',
    content: formHTML({ articulos, departamentos, usuarios }),
    confirmText: 'Registrar',
    onConfirm: () => submitForm(),
  });
}

function formHTML({ articulos, departamentos, usuarios }) {
  const optsArticulos = articulos.map(a =>
    `<option value="${a.id}">${escapeHtml(a.codigo)} — ${escapeHtml(a.nombre)}</option>`
  ).join('');

  const optsDepartamentos = departamentos.map(d =>
    `<option value="${d.id}">${escapeHtml(d.nombre)}</option>`
  ).join('');

  const optsUsuarios = usuarios.map(u =>
    `<option value="${u.id}">${escapeHtml(u.nombre_completo)}</option>`
  ).join('');

  return `
    <form id="form-salida" class="form-grid" novalidate>

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

      <label class="form__field form__field--full">
        <span>Departamento *</span>
        <select name="departamento_id" required>
          <option value="">Seleccioná un departamento</option>
          ${optsDepartamentos}
        </select>
      </label>

      <label class="form__field form__field--full">
        <span>Colaborador *</span>
        <select name="colaborador_id" required>
          <option value="">Seleccioná un colaborador</option>
          ${optsUsuarios}
        </select>
      </label>

      <label class="form__field form__field--full">
        <span>Observaciones</span>
        <textarea name="observaciones" maxlength="500" placeholder="Opcional"></textarea>
      </label>

    </form>
  `;
}

async function submitForm() {
  const form = document.getElementById('form-salida');
  if (!form) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const fd = new FormData(form);

  const payload = {
    articulo_id:     fd.get('articulo_id'),
    cantidad:        parseInt(fd.get('cantidad'), 10),
    departamento_id: fd.get('departamento_id'),
    colaborador_id:  fd.get('colaborador_id'),
  };

  const observaciones = fd.get('observaciones')?.trim();
  if (observaciones) payload.observaciones = observaciones;

  const submitBtn = document.querySelector('#modal-container button[data-action="confirm"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';
  }

  try {
    const result = await crearSalida(payload);
    closeModal();
    Toast.success(`Salida registrada. Stock actual: ${result.stock_actual}`);
    paginaActual = 1;
    cargarSalidas();
  } catch (err) {
    // Mensaje específico para stock insuficiente
    const mensaje = err.message?.toLowerCase().includes('stock insuficiente')
      ? 'No hay stock suficiente para completar esta salida.'
      : err.message;
    Toast.error(mensaje);
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

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
