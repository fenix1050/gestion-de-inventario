// =============================================================
// frontend/src/components/Sidebar.js
// Sidebar de navegación lateral persistente (singleton)
// =============================================================

import { authStore } from '../store/auth.store.js';

// Items de navegación con filtrado por rol
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  route: '/dashboard',  icon: '🏠', roles: ['consultor', 'operador', 'admin'] },
  { id: 'articulos', label: 'Artículos',  route: '/articulos',  icon: '📦', roles: ['consultor', 'operador', 'admin'] },
  { id: 'inventario',label: 'Inventario', route: '/inventario', icon: '📋', roles: ['consultor', 'operador', 'admin'] },
  { id: 'ingresos',  label: 'Ingresos',   route: '/ingresos',   icon: '➕', roles: ['operador', 'admin'] },
  { id: 'salidas',   label: 'Salidas',    route: '/salidas',    icon: '➖', roles: ['operador', 'admin'] },
  { id: 'historial', label: 'Historial',  route: '/historial',  icon: '📜', roles: ['consultor', 'operador', 'admin'] },
  { id: 'usuarios',  label: 'Usuarios',   route: '/usuarios',   icon: '👥', roles: ['admin'] },
];

// Estado privado del singleton — no se exporta
let mounted = false;
let sidebarEl = null;
let pageContentEl = null;
let hashChangeHandler = null;

function closeDropdown() {
  if (!sidebarEl) return;
  const dropdown = sidebarEl.querySelector('.sidebar-user-dropdown');
  if (dropdown) dropdown.hidden = true;
}

export const Sidebar = {
  /**
   * Monta el shell (sidebar + page-content) dentro del container.
   * Idempotente: si ya está montado, no hace nada.
   * @param {HTMLElement} appContainer - normalmente document.getElementById('app')
   */
  mount(appContainer) {
    if (mounted) return;

    const user = authStore.user;
    if (!user) throw new Error('Sidebar.mount requiere sesión activa');

    // Limpiar #app y construir el shell de dos columnas
    appContainer.innerHTML = '';
    appContainer.classList.add('has-shell');

    sidebarEl = document.createElement('aside');
    sidebarEl.id = 'sidebar';
    sidebarEl.innerHTML = buildSidebarHTML(user);

    pageContentEl = document.createElement('main');
    pageContentEl.id = 'page-content';

    appContainer.appendChild(sidebarEl);
    appContainer.appendChild(pageContentEl);

    // Registrar listener de hashchange para actualizar link activo
    hashChangeHandler = () => updateActiveLink();
    window.addEventListener('hashchange', hashChangeHandler);

    // Toggle del dropdown de usuario
    const avatarBtn = sidebarEl.querySelector('[data-action="toggle-user-menu"]');
    const dropdown = sidebarEl.querySelector('.sidebar-user-dropdown');

    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', closeDropdown);

    // Logout desde dropdown
    sidebarEl.querySelector('[data-action="logout"]').addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });

    // Ir a dashboard desde dropdown
    sidebarEl.querySelector('[data-action="go-dashboard"]').addEventListener('click', () => {
      dropdown.hidden = true;
    });

    // Marcar link activo en el montaje inicial
    updateActiveLink();

    mounted = true;
  },

  /**
   * Desmonta el shell: remueve listeners, vacía #app y resetea estado.
   * Idempotente: si no está montado, no hace nada.
   */
  unmount() {
    if (!mounted) return;

    window.removeEventListener('hashchange', hashChangeHandler);
    document.removeEventListener('click', closeDropdown);

    const appContainer = sidebarEl.parentElement;
    appContainer.classList.remove('has-shell');
    appContainer.innerHTML = ''; // restaura #app vacío para que el router lo use

    sidebarEl = null;
    pageContentEl = null;
    hashChangeHandler = null;
    mounted = false;
  },

  /** Devuelve si el sidebar está actualmente montado */
  isMounted() {
    return mounted;
  },
};

/**
 * Construye el HTML interno del sidebar filtrando items por rol del usuario.
 * @param {{ nombre?: string, email: string, rol: string }} user
 */
function buildSidebarHTML(user) {
  const items = NAV_ITEMS
    .filter((item) => item.roles.includes(user.rol))
    .map(
      (item) =>
        `<a href="#${item.route}" data-route="${item.route}" class="sidebar-link">
          <span class="sidebar-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>`
    )
    .join('');

  const displayName = user.nombre ?? user.email;
  const initials = getInitials(displayName);

  return `
    <div class="sidebar-header">
      <span class="sidebar-brand">Gestión Tajy</span>
      <div class="sidebar-avatar-wrap">
        <button type="button" class="sidebar-avatar" data-action="toggle-user-menu" aria-label="Menú de usuario">
          ${initials}
        </button>
        <div class="sidebar-user-dropdown" hidden>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${displayName}</div>
            <div class="sidebar-user-email">${user.email}</div>
            <div class="sidebar-user-rol">Rol: ${capitalize(user.rol)}</div>
          </div>
          <div class="sidebar-user-actions">
            <a href="#/dashboard" class="sidebar-dropdown-link" data-action="go-dashboard">
              <span>🏠</span> Dashboard
            </a>
            <button type="button" class="sidebar-dropdown-link sidebar-dropdown-logout" data-action="logout">
              <span>↪</span> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${items}
    </nav>
  `;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Marca con `.is-active` el link cuya ruta coincide con el hash actual.
 * Se llama en cada hashchange y al montar.
 */
function updateActiveLink() {
  if (!sidebarEl) return;
  const current = window.location.hash.slice(1) || '/dashboard';
  sidebarEl.querySelectorAll('.sidebar-link').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.route === current);
  });
}

/**
 * Flujo de logout:
 * 1. unmount() primero (crítico: shell debe estar desmontado antes de que el router reaccione)
 * 2. authStore.logout() limpia sesión y redirige a #/login (dispara hashchange)
 */
async function handleLogout() {
  Sidebar.unmount();
  authStore.logout();
}
