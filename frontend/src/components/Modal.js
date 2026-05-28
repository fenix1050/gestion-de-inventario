// =============================================================
// frontend/src/components/Modal.js
// Modal reutilizable con variantes form y confirm.
// Se monta en #modal-container (fuera de #app).
// =============================================================

const CONTAINER_ID = 'modal-container';

function getContainer() {
  const el = document.getElementById(CONTAINER_ID);
  if (!el) throw new Error(`No existe #${CONTAINER_ID} en el DOM`);
  return el;
}

/**
 * Muestra un modal.
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.content - HTML string para el body
 * @param {Function} [opts.onConfirm] - si se define, agrega botón Confirmar
 * @param {Function} [opts.onCancel]  - callback al cancelar/cerrar
 * @param {string} [opts.confirmText='Confirmar']
 * @param {string} [opts.cancelText='Cancelar']
 * @param {boolean} [opts.hideCancel=false] - si true, oculta el botón Cancelar
 * @param {'form'|'confirm'} [opts.variant='form']
 */
export function showModal({
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  hideCancel = false,
  variant = 'form',
} = {}) {
  const container = getContainer();

  const cancelBtn = (!hideCancel)
    ? `<button type="button" class="btn btn--secondary" data-action="cancel">${cancelText}</button>`
    : '';

  const confirmBtn = onConfirm
    ? `<button type="button" class="btn ${variant === 'confirm' ? 'btn--danger' : 'btn--primary'}" data-action="confirm">${confirmText}</button>`
    : '';

  const footer = (cancelBtn || confirmBtn)
    ? `<div class="modal__footer">${cancelBtn}${confirmBtn}</div>`
    : '';

  container.innerHTML = `
    <div class="modal-overlay" data-action="overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header class="modal__header">
          <h2 id="modal-title" class="modal__title">${title}</h2>
          <button type="button" class="modal__close" data-action="close" aria-label="Cerrar">&times;</button>
        </header>
        <div class="modal__body">${content ?? ''}</div>
        ${footer}
      </div>
    </div>
  `;

  const overlay = container.querySelector('.modal-overlay');
  const modalEl = container.querySelector('.modal');

  const handleClose = () => {
    closeModal();
    if (typeof onCancel === 'function') onCancel();
  };

  // Click en el overlay (no en el panel) cierra
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) handleClose();
  });

  // Delegación de clicks en header y footer
  modalEl.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'close' || action === 'cancel') {
      handleClose();
    } else if (action === 'confirm') {
      if (typeof onConfirm === 'function') {
        onConfirm();
      } else {
        closeModal();
      }
    }
  });

  // Foco inicial al primer input o al botón confirmar
  const firstFocusable = modalEl.querySelector(
    'input, select, textarea, button[data-action="confirm"]'
  );
  if (firstFocusable) firstFocusable.focus();
}

export function closeModal() {
  const container = getContainer();
  container.innerHTML = '';
}

export const Modal = { open: showModal, close: closeModal };
