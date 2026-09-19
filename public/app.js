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
const staffNav = document.querySelector('#staff-nav');
const staffMenuLink = document.querySelector('#staff-menu-link');
const staffMenuLabel = document.querySelector('#staff-menu-label');
const publicRubrosMenu = document.querySelector('.public-page .side-nav, .catalog-page .side-nav');
const homeGallery = document.querySelector('.hero-still');

function setMenu(open) {
  if (!sideMenu || !menuOverlay || !menuToggle) return;
  sideMenu.hidden = !open;
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
setMenu(false);

function showDashboard(user) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  if (userName) userName.textContent = user.nombre || user.usuario;
}

if (homeGallery) {
  homeGallery.innerHTML = '<div class="hero-gallery"><figure class="gallery-main"><img src="/images/local-1.jpg" alt="Interior del local CRV4 Mayorista" /><figcaption>Variedad para tu negocio</figcaption></figure><div class="gallery-side"><figure><img src="/images/local-2.jpg" alt="Exhibición de productos en el local" loading="lazy" /></figure><figure><img src="/images/local-3.jpg" alt="Sector de accesorios y bijouterie" loading="lazy" /></figure></div></div>';
  const mobileSlides = homeGallery.querySelectorAll('.hero-gallery > figure, .hero-gallery > .gallery-side > figure');
  let mobileSlide = 0;
  const moveMobileSlide = (index) => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      if (index >= mobileSlides.length) return;
      mobileSlide = index;
      mobileSlides[mobileSlide].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  };
  if (mobileSlides.length > 1) window.setInterval(() => moveMobileSlide(mobileSlide + 1), 5000);
}

function showStaffNavigation(user) {
  if (staffNav) staffNav.hidden = true;
  if (staffMenuLink) staffMenuLink.hidden = true;
  if (staffMenuLabel) staffMenuLabel.textContent = user?.nombre || user?.usuario || 'CRV4 Mayorista';
}

async function getSession() {
  const response = await fetch('/api/auth/me');
  if (response.ok) {
    const user = (await response.json()).usuario;
    showStaffNavigation(user);
    if (loginForm) showDashboard(user);
  } else {
    showStaffNavigation(null);
  }
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
    showStaffNavigation(result.usuario);
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

getSession().catch(() => showStaffNavigation(null));

const cartCount = document.querySelector('#cart-count');
const cartSummary = document.querySelector('#cart-summary');
const guestCart = JSON.parse(localStorage.getItem('crv5_guest_cart') || '[]');
if (cartCount) cartCount.textContent = guestCart.reduce((total, item) => total + (item.cantidad || 0), 0);
if (cartSummary && guestCart.length) cartSummary.textContent = `${guestCart.length} producto${guestCart.length === 1 ? '' : 's'} en tu selección.`;

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });

const rubrosTable = document.querySelector('#rubros-table-body');
const rubroForm = document.querySelector('#rubro-form');
const rubroMessage = document.querySelector('#rubro-message');
const rubroParent = document.querySelector('#id_rubro_padre');

async function loadRubros() {
  if (!rubrosTable) return;
  const response = await fetch('/api/rubros');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los rubros.');
  const rubrosById = new Map(result.rubros.map((rubro) => [String(rubro.id), rubro.nombre]));
  if (rubroParent) {
    rubroParent.innerHTML = '<option value="">Sin rubro padre</option>';
    result.rubros.filter((rubro) => rubro.activo).forEach((rubro) => {
      rubroParent.insertAdjacentHTML('beforeend', `<option value="${rubro.id}">${rubro.nombre}</option>`);
    });
  }
  rubrosTable.innerHTML = result.rubros.length
    ? result.rubros.map((rubro) => `<tr><td>${rubro.orden}</td><td><strong>${rubro.nombre}</strong><small>${rubro.codigo}</small></td><td>${rubro.id_rubro_padre ? rubrosById.get(String(rubro.id_rubro_padre)) || 'No encontrado' : 'Principal'}</td><td>${rubro.slug}</td><td><span class="table-status ${rubro.activo ? '' : 'is-inactive'}">${rubro.activo ? 'Activo' : 'Inactivo'}</span></td></tr>`).join('')
    : '<tr><td colspan="5" class="table-empty">Todavía no hay rubros cargados.</td></tr>';
}

rubroForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  rubroMessage.textContent = '';
  const submitButton = rubroForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const data = Object.fromEntries(new FormData(rubroForm));
    const response = await fetch('/api/rubros', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo crear el rubro.');
    rubroForm.reset();
    rubroMessage.textContent = 'Rubro creado correctamente.';
    await loadRubros();
  } catch (error) {
    rubroMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

loadRubros().catch((error) => { if (rubroMessage) rubroMessage.textContent = error.message; });

async function loadPublicRubrosMenu() {
  if (!publicRubrosMenu) return;
  const response = await fetch('/api/catalogo/rubros');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los rubros.');
  publicRubrosMenu.innerHTML = result.rubros.length
    ? result.rubros.map((rubro) => `<a href="/catalogo?rubro=${encodeURIComponent(rubro.slug)}">${rubro.nombre}<span>→</span></a>`).join('')
    : '<p class="menu-empty">Todavía no hay rubros publicados.</p>';
}

async function loadCatalogRubro() {
  const catalogHeading = document.querySelector('#catalog-heading');
  if (!catalogHeading) return;
  const slug = new URLSearchParams(window.location.search).get('rubro');
  if (!slug) return;
  const response = await fetch(`/api/catalogo/rubros/${encodeURIComponent(slug)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo cargar el rubro.');
  catalogHeading.textContent = result.rubro.nombre;
  document.querySelector('#catalog-description').textContent = result.rubro.descripcion || 'Explorá la selección disponible en este rubro.';
  const children = document.querySelector('#catalog-children');
  children.innerHTML = result.hijos.length
    ? result.hijos.map((hijo) => `<a class="catalog-child" href="/catalogo?rubro=${encodeURIComponent(hijo.slug)}"><strong>${hijo.nombre}</strong><span>→</span></a>`).join('')
    : '<p class="catalog-empty-note">Este rubro todavía no tiene subrubros.</p>';
  document.querySelector('#catalog-products').innerHTML = '<p class="catalog-empty-note">Todavía no hay productos publicados en este rubro.</p>';
}

loadPublicRubrosMenu().catch(() => {});
loadCatalogRubro().catch((error) => {
  const message = document.querySelector('#catalog-message');
  if (message) message.textContent = error.message;
});
