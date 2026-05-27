// =============================================================
// frontend/src/pages/login.js
// Página de inicio de sesión
// =============================================================

import { authService } from '../services/auth.service.js';

export const render = async (container) => {
  container.innerHTML = `
    <div class="login-container" style="display: flex; height: 100vh; align-items: center; justify-content: center; background-color: var(--color-background-alt);">
      <div class="login-card" style="background: white; padding: 2rem; border-radius: var(--border-radius-lg); box-shadow: var(--shadow-md); width: 100%; max-width: 400px;">
        
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="color: var(--color-primary); margin-bottom: 0.5rem;">Aseguradora Tajy</h1>
          <p style="color: var(--color-text-light);">Sistema de Gestión de Inventario</p>
        </div>

        <form id="login-form">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email corporativo</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="tu.nombre@tajy.com.py" 
              required
              style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: var(--border-radius-sm);"
            >
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label for="password" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              required
              style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: var(--border-radius-sm);"
            >
          </div>

          <div id="login-error" style="color: var(--color-danger); font-size: 0.875rem; margin-bottom: 1rem; display: none;"></div>

          <button 
            type="submit" 
            id="login-btn"
            style="width: 100%; padding: 0.75rem; background-color: var(--color-primary); color: white; border: none; border-radius: var(--border-radius-sm); font-weight: bold; cursor: pointer;"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  `;

  // Agregamos listeners
  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Estado de carga
    errorDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Verificando...';
    btn.style.opacity = '0.7';

    try {
      await authService.login(email, password);
      // Si el login fue exitoso, redirigimos al dashboard
      window.location.hash = '#/dashboard';
    } catch (error) {
      // Mostramos el error
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    } finally {
      // Restauramos el botón
      btn.disabled = false;
      btn.textContent = 'Ingresar';
      btn.style.opacity = '1';
    }
  });
};
