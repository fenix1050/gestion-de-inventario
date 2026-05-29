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

    // Registrar click en botón de logout
    sidebarEl
      .querySelector('[data-action="logout"]')
      .addEventListener('click', (e) => {
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
    // El listener de logout muere junto con el nodo del DOM

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

  return `
    <div class="sidebar-header">
      <span class="sidebar-brand">Gestión Tajy</span>
    </div>
    <nav class="sidebar-nav">
      ${items}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-user-name">${displayName}</div>
        <div class="sidebar-user-rol">${user.rol}</div>
      </div>
      <button type="button" class="sidebar-logout" data-action="logout">
        Cerrar sesión
      </button>
    </div>
  `;
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
