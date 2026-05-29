// =============================================================
// frontend/src/utils/loader.js
// Componente reutilizable de carga (spinner + mensaje)
// =============================================================

export function createLoader(message = 'Cargando...') {
  return `<div class="loader-container">
    <div class="loader-spinner"></div>
    <p class="loader-text">${message}</p>
  </div>`;
}
