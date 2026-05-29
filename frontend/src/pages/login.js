// =============================================================
// frontend/src/pages/login.js
// Página de inicio de sesión
// =============================================================

import { authService } from '../services/auth.service.js';
import { Sidebar } from '../components/Sidebar.js';

export const render = async (container) => {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-left">
        <div class="login-form-box">
          <h1 class="login-title">Iniciar Sesión</h1>
          <p class="login-subtitle">Sistema de Gestión de Inventario</p>

          <form id="login-form">
            <div class="login-field">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Usuario"
                required
                autocomplete="email"
              >
            </div>

            <div class="login-field login-field--password">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Contraseña"
                required
                autocomplete="current-password"
              >
              <button type="button" id="toggle-password" class="login-toggle-pw" aria-label="Mostrar contraseña">
                <svg id="eye-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>

            <div id="login-error" class="login-error" style="display:none;"></div>

            <button type="submit" id="login-btn" class="login-btn">
              Iniciar sesión
            </button>
          </form>

          <p class="login-contact">
            ¿No tenés cuenta? <a href="mailto:sistemas@tajy.com.py">Contactá al administrador</a>
          </p>

          <blockquote class="login-quote">
            "Gestioná todos tus recursos de manera eficiente y profesional"
          </blockquote>
        </div>
      </div>

      <div class="login-right">
        <img src="../../logo/edificio-tajy.jpg" alt="Edificio Tajy" class="login-building-img">
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = passwordInput.value;

    errorDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
      await authService.login(email, password);
      Sidebar.mount(document.getElementById('app'));
      window.location.hash = '#/dashboard';
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Iniciar sesión';
    }
  });
};
