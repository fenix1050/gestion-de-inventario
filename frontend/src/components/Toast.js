// =============================================================
// frontend/src/components/Toast.js
// Notificaciones no bloqueantes con auto-dismiss y apilado.
// Se monta SIEMPRE en #toast-container (fuera de #app).
// =============================================================

const CONTAINER_ID = 'toast-container';
const DEFAULT_DURATION = { success: 3000, error: 5000, info: 3000 };

function getContainer() {
  const el = document.getElementById(CONTAINER_ID);
  if (!el) {
    throw new Error(`No existe #${CONTAINER_ID} en el DOM`);
  }
  return el;
}

/**
 * Muestra un toast. Apila si ya hay otros visibles.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} [duration] - ms; usa default según type si se omite
 */
export function showToast(message, type = 'success', duration) {
  const container = getContainer();
  const ms = duration ?? DEFAULT_DURATION[type] ?? 3000;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-dismiss: agrega clase fade-out 300ms antes y luego remueve
  const fadeMs = 300;
  setTimeout(() => {
    toast.classList.add('toast--fade-out');
    setTimeout(() => toast.remove(), fadeMs);
  }, Math.max(0, ms - fadeMs));
}

// Azúcar sintáctica para los tipos más comunes
export const Toast = {
  success: (msg, dur) => showToast(msg, 'success', dur),
  error:   (msg, dur) => showToast(msg, 'error', dur),
  info:    (msg, dur) => showToast(msg, 'info', dur),
};
