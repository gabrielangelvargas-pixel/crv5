const loginView = document.querySelector('#login-view');
const dashboardView = document.querySelector('#dashboard-view');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const userName = document.querySelector('#user-name');
const logoutButton = document.querySelector('#logout-button');
const menuToggle = document.querySelector('#menu-toggle');
const menuClose = document.querySelector('#menu-close');
const sideMenu = document.querySelector('#side-menu');
const menuOverlay = document.querySelector('#menu-overlay');

function setMenu(open) {
  if (!sideMenu || !menuOverlay || !menuToggle) return;
  sideMenu.classList.toggle('is-open', open);
  sideMenu.setAttribute('aria-hidden', String(!open));
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  menuOverlay.hidden = !open;
}

menuToggle?.addEventListener('click', () => setMenu(!sideMenu.classList.contains('is-open')));
menuClose?.addEventListener('click', () => setMenu(false));
menuOverlay?.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

function showDashboard(user) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  if (userName) userName.textContent = user.nombre || user.usuario;
}

async function getSession() {
  const response = await fetch('/api/auth/me');
  if (response.ok) showDashboard((await response.json()).usuario);
}

loginForm?.addEventListener('submit', async (event) => {
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

logoutButton?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  dashboardView.hidden = true;
  loginView.hidden = false;
  loginForm.querySelector('#usuario').focus();
});

if (loginForm) getSession().catch(() => {});

const cartCount = document.querySelector('#cart-count');
const cartSummary = document.querySelector('#cart-summary');
const guestCart = JSON.parse(localStorage.getItem('crv5_guest_cart') || '[]');
if (cartCount) cartCount.textContent = guestCart.reduce((total, item) => total + (item.cantidad || 0), 0);
if (cartSummary && guestCart.length) cartSummary.textContent = `${guestCart.length} producto${guestCart.length === 1 ? '' : 's'} en tu selección.`;

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
