// =============================================================
// frontend/src/pages/usuarios.js
// Página de gestión de usuarios. Solo accesible para rol admin.
// Guard de rol en render() — el router no aplica restricciones.
// =============================================================

import { getUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, reactivarUsuario } from '../services/usuarios.service.js';
import { getDepartamentos } from '../services/departamentos.service.js';
import { authStore } from '../store/auth.store.js';
import { Toast } from '../components/Toast.js';
import { showModal, closeModal } from '../components/Modal.js';

export const render = async (container) => {
  // Guard de rol: solo admin puede acceder
  const rol = authStore.user?.rol;
  if (rol !== 'admin') {
    Toast.error('No tenés permisos para acceder a esta sección.');
    window.location.hash = '#/dashboard';
    return;
  }

  container.innerHTML = `
    <div class="page page--usuarios">
      <div class="page__header">
        <h1>Gestión de Usuarios</h1>
        <div class="page__header-actions">
          <button type="button" id="btn-volver" class="btn btn--secondary">Volver al Dashboard</button>
          <button type="button" id="btn-nuevo-usuario" class="btn btn--primary">Nuevo usuario</button>
        </div>
      </div>

      <div class="table-wrapper">
        <div id="usuarios-container">Cargando usuarios...</div>
      </div>
    </div>
  `;

  document.getElementById('btn-volver')
    .addEventListener('click', () => { window.location.hash = '#/dashboard'; });

  document.getElementById('btn-nuevo-usuario')
    .addEventListener('click', abrirModalCrear);

  await cargarUsuarios();
};

async function cargarUsuarios() {
  const cont = document.getElementById('usuarios-container');
  if (!cont) return;

  try {
    // Traer todos (activos e inactivos) para que admin pueda reactivar
    const data = await getUsuarios({ activo: undefined });
    renderTabla(cont, data || []);
  } catch (err) {
    cont.innerHTML = `<p class="error-message">Error al cargar usuarios: ${err.message}</p>`;
  }
}

function renderTabla(cont, usuarios) {
  if (usuarios.length === 0) {
    cont.innerHTML = `<p class="empty-state">No hay usuarios registrados.</p>`;
    return;
  }

  const filas = usuarios.map((u) => {
    const badgeClase = u.activo ? 'badge badge--activo' : 'badge badge--inactivo';
    const badgeTexto = u.activo ? 'Activo' : 'Inactivo';
    const botonToggle = u.activo
      ? `<button type="button" class="btn btn--danger btn--sm" data-action="desactivar" data-id="${u.id}" data-nombre="${escapeAttr(u.nombre_completo)}">Desactivar</button>`
      : `<button type="button" class="btn btn--secondary btn--sm" data-action="reactivar" data-id="${u.id}" data-nombre="${escapeAttr(u.nombre_completo)}">Reactivar</button>`;

    return `
      <tr>
        <td>${escapeHtml(u.nombre_completo)}</td>
        <td>${escapeHtml(u.email ?? '—')}</td>
        <td>${escapeHtml(u.rol)}</td>
        <td>${escapeHtml(u.departamento?.nombre ?? '—')}</td>
        <td><span class="${badgeClase}">${badgeTexto}</span></td>
        <td class="actions-cell">
          <button type="button" class="btn btn--secondary btn--sm" data-action="editar" data-id="${u.id}">Editar</button>
          ${botonToggle}
        </td>
      </tr>
    `;
  }).join('');

  cont.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Nombre completo</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Departamento</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;

  // Event delegation en la tabla para manejar acciones
  const tabla = cont.querySelector('table');
  tabla.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const { action, id, nombre } = btn.dataset;
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;

    if (action === 'editar') {
      await abrirModalEditar(usuario);
    } else if (action === 'desactivar') {
      await confirmarToggleActivo(usuario);
    } else if (action === 'reactivar') {
      await confirmarToggleActivo(usuario);
    }
  });
}

async function abrirModalCrear() {
  const btnNuevo = document.getElementById('btn-nuevo-usuario');
  if (btnNuevo) btnNuevo.disabled = true;

  let departamentos = [];
  try {
    departamentos = await getDepartamentos();
  } catch (err) {
    Toast.error('No se pudieron cargar los departamentos.');
    if (btnNuevo) btnNuevo.disabled = false;
    return;
  }

  if (btnNuevo) btnNuevo.disabled = false;

  showModal({
    title: 'Nuevo usuario',
    variant: 'drawer',
    content: formCrearHTML(departamentos),
    confirmText: 'Crear usuario',
    onConfirm: () => submitCrear(),
  });
}

async function abrirModalEditar(usuario) {
  let departamentos = [];
  try {
    departamentos = await getDepartamentos();
  } catch (err) {
    Toast.error('No se pudieron cargar los departamentos.');
    return;
  }

  showModal({
    title: 'Editar usuario',
    variant: 'drawer',
    content: formEditarHTML(usuario, departamentos),
    confirmText: 'Guardar cambios',
    onConfirm: () => submitEditar(usuario.id),
  });
}

async function confirmarToggleActivo(usuario) {
  const esDesactivar = usuario.activo;
  const accion = esDesactivar ? 'desactivar' : 'reactivar';
  const mensaje = esDesactivar
    ? `¿Estás seguro que querés desactivar a ${usuario.nombre_completo}? No podrá ingresar al sistema.`
    : `¿Querés reactivar a ${usuario.nombre_completo}? Podrá volver a ingresar al sistema.`;

  showModal({
    title: esDesactivar ? 'Desactivar usuario' : 'Reactivar usuario',
    variant: 'confirm',
    content: `<p>${escapeHtml(mensaje)}</p>`,
    confirmText: esDesactivar ? 'Desactivar' : 'Reactivar',
    onConfirm: async () => {
      try {
        if (esDesactivar) {
          await desactivarUsuario(usuario.id);
          Toast.success('Usuario desactivado.');
        } else {
          await reactivarUsuario(usuario.id);
          Toast.success('Usuario reactivado.');
        }
        closeModal();
        await cargarUsuarios();
      } catch (err) {
        Toast.error(err.message);
      }
    },
  });
}

function formCrearHTML(departamentos) {
  const optsDepartamentos = departamentos.map(d =>
    `<option value="${d.id}">${escapeHtml(d.nombre)}</option>`
  ).join('');

  return `
    <form id="form-usuario-crear" class="form-grid" novalidate>

      <label class="form__field form__field--full">
        <span>Nombre completo *</span>
        <input name="nombre_completo" type="text" minlength="2" maxlength="120" required placeholder="Ej: María González">
      </label>

      <label class="form__field form__field--full">
        <span>Email *</span>
        <input name="email" type="email" required placeholder="usuario@tajy.com.py">
      </label>

      <label class="form__field form__field--full">
        <span>Contraseña * (mínimo 8 caracteres)</span>
        <input name="password" type="password" minlength="8" required placeholder="••••••••">
      </label>

      <label class="form__field">
        <span>Rol *</span>
        <select name="rol" required>
          <option value="">Seleccioná un rol</option>
          <option value="consultor">Consultor</option>
          <option value="operador">Operador</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <label class="form__field">
        <span>Departamento</span>
        <select name="departamento_id">
          <option value="">Sin departamento</option>
          ${optsDepartamentos}
        </select>
      </label>

      <label class="form__field">
        <span>Cédula</span>
        <input name="cedula" type="text" maxlength="20" placeholder="Opcional">
      </label>

      <label class="form__field">
        <span>Teléfono</span>
        <input name="telefono" type="text" maxlength="30" placeholder="Opcional">
      </label>

    </form>
  `;
}

function formEditarHTML(usuario, departamentos) {
  const optsDepartamentos = departamentos.map(d =>
    `<option value="${d.id}" ${d.id === usuario.departamento_id ? 'selected' : ''}>${escapeHtml(d.nombre)}</option>`
  ).join('');

  return `
    <form id="form-usuario-editar" class="form-grid" novalidate>

      <label class="form__field form__field--full">
        <span>Nombre completo *</span>
        <input name="nombre_completo" type="text" minlength="2" maxlength="120" required value="${escapeAttr(usuario.nombre_completo)}">
      </label>

      <label class="form__field">
        <span>Rol *</span>
        <select name="rol" required>
          <option value="consultor" ${usuario.rol === 'consultor' ? 'selected' : ''}>Consultor</option>
          <option value="operador"  ${usuario.rol === 'operador'  ? 'selected' : ''}>Operador</option>
          <option value="admin"     ${usuario.rol === 'admin'     ? 'selected' : ''}>Admin</option>
        </select>
      </label>

      <label class="form__field">
        <span>Departamento</span>
        <select name="departamento_id">
          <option value="">Sin departamento</option>
          ${optsDepartamentos}
        </select>
      </label>

      <label class="form__field">
        <span>Cédula</span>
        <input name="cedula" type="text" maxlength="20" value="${escapeAttr(usuario.cedula ?? '')}">
      </label>

      <label class="form__field">
        <span>Teléfono</span>
        <input name="telefono" type="text" maxlength="30" value="${escapeAttr(usuario.telefono ?? '')}">
      </label>

    </form>
  `;
}

async function submitCrear() {
  const form = document.getElementById('form-usuario-crear');
  if (!form) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const fd = new FormData(form);

  const payload = {
    nombre_completo: fd.get('nombre_completo').trim(),
    email:           fd.get('email').trim(),
    password:        fd.get('password'),
    rol:             fd.get('rol'),
  };

  const departamento_id = fd.get('departamento_id');
  const cedula          = fd.get('cedula')?.trim();
  const telefono        = fd.get('telefono')?.trim();

  if (departamento_id) payload.departamento_id = departamento_id;
  if (cedula)          payload.cedula           = cedula;
  if (telefono)        payload.telefono         = telefono;

  const submitBtn = document.querySelector('#modal-container button[data-action="confirm"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando...';
  }

  try {
    await crearUsuario(payload);
    closeModal();
    Toast.success('Usuario creado exitosamente.');
    await cargarUsuarios();
  } catch (err) {
    Toast.error(err.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear usuario';
    }
  }
}

async function submitEditar(id) {
  const form = document.getElementById('form-usuario-editar');
  if (!form) return;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const fd = new FormData(form);

  const payload = {};

  const nombre_completo = fd.get('nombre_completo')?.trim();
  const rol             = fd.get('rol');
  const departamento_id = fd.get('departamento_id');
  const cedula          = fd.get('cedula')?.trim();
  const telefono        = fd.get('telefono')?.trim();

  if (nombre_completo) payload.nombre_completo = nombre_completo;
  if (rol)             payload.rol             = rol;
  // departamento_id puede ser string vacío (sin departamento) → enviar null
  payload.departamento_id = departamento_id || null;
  if (cedula)          payload.cedula          = cedula;
  if (telefono)        payload.telefono        = telefono;

  const submitBtn = document.querySelector('#modal-container button[data-action="confirm"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }

  try {
    await actualizarUsuario(id, payload);
    closeModal();
    Toast.success('Usuario actualizado.');
    await cargarUsuarios();
  } catch (err) {
    Toast.error(err.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar cambios';
    }
  }
}

// ------- Utilidades locales -------

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return String(s ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
