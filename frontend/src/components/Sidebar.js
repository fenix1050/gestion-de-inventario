// =============================================================
// frontend/src/components/Sidebar.js
// Sidebar de navegación lateral persistente (singleton)
// =============================================================

import { authStore } from '../store/auth.store.js';

// Items de navegación con filtrado por rol
const ICONS = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  articulos:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  inventario: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/><line x1="9" y1="8" x2="11" y2="8"/></svg>`,
  ingresos:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  salidas:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
  historial:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4"/><polyline points="3 16 3 11 8 11"/></svg>`,
  usuarios:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  reportes:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  route: '/dashboard',  icon: ICONS.dashboard,  roles: ['consultor', 'operador', 'admin'] },
  { id: 'articulos', label: 'Artículos',  route: '/articulos',  icon: ICONS.articulos,  roles: ['consultor', 'operador', 'admin'] },
  { id: 'inventario',label: 'Inventario', route: '/inventario', icon: ICONS.inventario, roles: ['consultor', 'operador', 'admin'] },
  { id: 'ingresos',  label: 'Ingresos',   route: '/ingresos',   icon: ICONS.ingresos,   roles: ['operador', 'admin'] },
  { id: 'salidas',   label: 'Salidas',    route: '/salidas',    icon: ICONS.salidas,    roles: ['operador', 'admin'] },
  { id: 'historial', label: 'Historial',  route: '/historial',  icon: ICONS.historial,  roles: ['consultor', 'operador', 'admin'] },
  { id: 'reportes',  label: 'Reportes',   route: '/reportes',   icon: ICONS.reportes,   roles: ['consultor', 'operador', 'admin'] },
  { id: 'usuarios',  label: 'Usuarios',   route: '/usuarios',   icon: ICONS.usuarios,   roles: ['admin'] },
];

// Estado privado del singleton — no se exporta
let mounted = false;
let sidebarEl = null;
let pageContentEl = null;
let hashChangeHandler = null;

function closeDropdown() {
  const navbar = document.getElementById('top-navbar');
  if (!navbar) return;
  const dropdown = navbar.querySelector('.sidebar-user-dropdown');
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

    // Limpiar #app y construir el shell: navbar top + (sidebar | content)
    appContainer.innerHTML = '';
    appContainer.classList.add('has-shell');

    // Navbar superior full-width
    const navbarEl = document.createElement('header');
    navbarEl.id = 'top-navbar';
    navbarEl.innerHTML = buildNavbarHTML(user);

    // Contenedor inferior: sidebar + page-content
    const shellBodyEl = document.createElement('div');
    shellBodyEl.id = 'shell-body';

    sidebarEl = document.createElement('aside');
    sidebarEl.id = 'sidebar';
    sidebarEl.innerHTML = buildSidebarHTML();

    pageContentEl = document.createElement('main');
    pageContentEl.id = 'page-content';

    shellBodyEl.appendChild(sidebarEl);
    shellBodyEl.appendChild(pageContentEl);

    appContainer.appendChild(navbarEl);
    appContainer.appendChild(shellBodyEl);

    // Registrar listener de hashchange para actualizar link activo
    hashChangeHandler = () => updateActiveLink();
    window.addEventListener('hashchange', hashChangeHandler);

    // Toggle del dropdown de usuario (ahora en el navbar)
    const avatarBtn = navbarEl.querySelector('[data-action="toggle-user-menu"]');
    const dropdown = navbarEl.querySelector('.sidebar-user-dropdown');

    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', closeDropdown);

    // Logout desde dropdown
    navbarEl.querySelector('[data-action="logout"]').addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
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
 * Construye el HTML del navbar superior (marca + avatar con dropdown).
 * @param {{ nombre?: string, email: string, rol: string }} user
 */
function buildNavbarHTML(user) {
  const displayName = user.nombre ?? user.email;
  const initials = getInitials(displayName);

  return `
    <div class="navbar-brand">
      <img src="./public/logo/logo.svg" alt="Aseguradora Tajy" class="navbar-logo">
    </div>
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
          <button type="button" class="sidebar-dropdown-link sidebar-dropdown-logout" data-action="logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Construye el HTML interno del sidebar (solo links de navegación).
 */
function buildSidebarHTML() {
  const user = authStore.user;
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

  return `<nav class="sidebar-nav">${items}</nav>`;
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
