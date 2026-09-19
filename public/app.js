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
const homeOfferSlot = document.querySelector('#home-offer-slot');

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
  homeGallery.innerHTML = '<p class="eyebrow local-title">Nuestro local</p><div class="hero-gallery"><figure class="gallery-main"><img src="/images/local-1.jpg" alt="Interior del local CRV4 Mayorista" /></figure><div class="gallery-side"><figure><img src="/images/local-2.jpg" alt="Exhibición de productos en el local" loading="lazy" /></figure><figure><img src="/images/local-3.jpg" alt="Sector de accesorios y bijouterie" loading="lazy" /></figure></div></div>';
  const heroSlider = homeGallery.querySelector('.hero-gallery');
  const firstSlide = heroSlider.querySelector('.gallery-main').cloneNode(true);
  firstSlide.className = 'gallery-clone';
  firstSlide.setAttribute('aria-hidden', 'true');
  heroSlider.appendChild(firstSlide);
  const mobileSlides = heroSlider.querySelectorAll('figure');
  let mobileSlide = 0;
  const moveMobileSlide = (index) => {
    if (window.matchMedia('(max-width: 760px)').matches) {
      mobileSlide = Math.min(index, mobileSlides.length - 1);
      const targetSlide = mobileSlides[mobileSlide];
      const targetLeft = targetSlide.getBoundingClientRect().left - heroSlider.getBoundingClientRect().left + heroSlider.scrollLeft;
      heroSlider.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  };
  let scrollResetTimer;
  heroSlider.addEventListener('scroll', () => {
    window.clearTimeout(scrollResetTimer);
    scrollResetTimer = window.setTimeout(() => {
      const nearestSlide = Math.round(heroSlider.scrollLeft / heroSlider.clientWidth);
      mobileSlide = nearestSlide;
      if (nearestSlide === mobileSlides.length - 1) {
        heroSlider.scrollTo({ left: 0, behavior: 'auto' });
        mobileSlide = 0;
      }
    }, 140);
  }, { passive: true });
  if (mobileSlides.length > 1) window.setInterval(() => moveMobileSlide(mobileSlide + 1), 5000);

  const heroSection = homeGallery.closest('.hero-section');
  const heroCopy = heroSection?.querySelector('.hero-copy');
  if (heroSection && heroCopy) {
    const mobileBenefits = document.createElement('section');
    mobileBenefits.className = 'mobile-benefits';
    mobileBenefits.setAttribute('aria-label', 'Beneficios de compra');
    mobileBenefits.innerHTML = '<article><span class="benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span><strong>Compra mayorista</strong><span>Mínimo de inversión $70.000</span></article><article><span class="benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg></span><strong>Medios de pago</strong><span>Tarjetas, transferencias, efectivo</span></article><article><span class="benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><path d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg></span><strong>Envíos al país</strong><span>Despachos rápidos y seguros. Seguimientos.</span></article><article><span class="benefit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v3a2 2 0 0 0 2 2h1v-5H4Zm16 0v3a2 2 0 0 1-2 2h-1v-5h3Z"/><path d="M15 20h-3a2 2 0 0 1-2-2"/></svg></span><strong>Atención cercana</strong><span>Te asesoramos y te guiamos en cada pedido.</span></article>';
    const informationTitle = document.createElement('p');
    informationTitle.className = 'eyebrow mobile-information-title';
    informationTitle.textContent = 'Información';
    heroSection.insertBefore(informationTitle, heroCopy);
    heroSection.insertBefore(mobileBenefits, heroCopy);
    const popularRubros = document.createElement('section');
    popularRubros.className = 'popular-rubros';
    popularRubros.setAttribute('aria-labelledby', 'popular-rubros-title');
    popularRubros.innerHTML = '<p class="eyebrow" id="popular-rubros-title">Rubros más vistos</p><div id="popular-rubros-grid" class="popular-rubros-grid"><p class="catalog-empty-note">Cargando rubros...</p></div>';
    heroSection.insertBefore(popularRubros, heroCopy);
  }
}

if (homeOfferSlot) {
  homeOfferSlot.innerHTML = '<a class="popular-offer" href="/catalogo?rubro=ofertas" aria-label="Ver ofertas"><img src="/images/rubros/oferta.png" alt="Ofertas" loading="lazy" /></a>';
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
const footerWhatsapp = document.querySelector('.footer-whatsapp');
const footerBrand = document.querySelector('.footer-brand');
if (footerWhatsapp) {
  footerWhatsapp.href = 'https://wa.me/542644823420';
  footerWhatsapp.setAttribute('aria-label', 'Contactar al local por WhatsApp al +54 264 482 3420');
  footerWhatsapp.querySelector('span').textContent = '+54 264 482 3420';
}
if (footerBrand) {
  footerBrand.querySelector('span').innerHTML = '2026<br /><a class="gav-link" href="https://wa.me/5493814458274" target="_blank" rel="noreferrer">Diseño GAV</a>';
}
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
  const popularRubrosGrid = document.querySelector('#popular-rubros-grid');
  const response = await fetch('/api/catalogo/rubros');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los rubros.');
  const rubrosUnicos = result.rubros.filter((rubro, index, rubros) => rubros.findIndex((item) => item.nombre.toLocaleLowerCase() === rubro.nombre.toLocaleLowerCase()) === index);
  publicRubrosMenu.innerHTML = rubrosUnicos.length
    ? rubrosUnicos.map((rubro) => `<a href="/catalogo?rubro=${encodeURIComponent(rubro.slug)}">${rubro.nombre}<span>→</span></a>`).join('')
    : '<p class="menu-empty">Todavía no hay rubros publicados.</p>';
  if (popularRubrosGrid) {
    popularRubrosGrid.innerHTML = rubrosUnicos.length
      ? rubrosUnicos.slice(0, 4).map((rubro) => `<a href="/catalogo?rubro=${encodeURIComponent(rubro.slug)}">${rubro.imagen ? `<img src="${rubro.imagen}" alt="" loading="lazy" />` : ''}<span class="popular-rubro-content"><strong>${rubro.nombre}</strong></span></a>`).join('')
      : '<p class="catalog-empty-note">Todavía no hay rubros publicados.</p>';
  }
}

async function loadCatalogRubro() {
  const catalogBrowser = document.querySelector('.catalog-browser');
  const catalogCover = document.querySelector('#catalog-cover');
  const catalogDescription = document.querySelector('#catalog-description');
  if (!catalogBrowser || !catalogDescription) return;
  const slug = new URLSearchParams(window.location.search).get('rubro');
  if (!slug) {
    catalogDescription.textContent = 'Seleccioná una categoría para ver sus subrubros y productos.';
    document.querySelector('#catalog-children').innerHTML = '<p class="catalog-empty-note">Seleccioná un rubro desde el menú.</p>';
    document.querySelector('#catalog-products').innerHTML = '<p class="catalog-empty-note">Seleccioná un rubro para ver sus productos.</p>';
    return;
  }
  const response = await fetch(`/api/catalogo/rubros/${encodeURIComponent(slug)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'No se pudo cargar el rubro.');
  if (catalogCover && result.rubro.imagen) {
    catalogCover.innerHTML = `<img src="${result.rubro.imagen}" alt="Portada de ${result.rubro.nombre}" />`;
    catalogCover.setAttribute('aria-hidden', 'false');
  }
  catalogDescription.textContent = result.rubro.descripcion || 'Explorá la selección disponible en este rubro.';
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
