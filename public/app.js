const loginView = document.querySelector('#login-view');
const dashboardView = document.querySelector('#dashboard-view');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const userName = document.querySelector('#user-name');
const logoutButton = document.querySelector('#logout-button');

function showDashboard(user) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  userName.textContent = user.nombre || user.usuario;
}

async function getSession() {
  const response = await fetch('/api/auth/me');
  if (response.ok) showDashboard((await response.json()).usuario);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';
  const submitButton = loginForm.querySelector('button');
  submitButton.disabled = true;
  try {
    const formData = new FormData(loginForm);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: formData.get('usuario'), clave: formData.get('clave') }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo iniciar sesión.');
    loginForm.reset();
    showDashboard(result.usuario);
  } catch (error) {
    loginMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

logoutButton.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  dashboardView.hidden = true;
  loginView.hidden = false;
  loginForm.querySelector('#usuario').focus();
});

getSession().catch(() => {});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
