/* =========================================================
   MAISON ÉLITE: script.js
   Lenis smooth scroll, GSAP + ScrollTrigger animations,
   pinned hero, horizontal scroll, filters, lightbox,
   counters, testimonials, forms, custom cursor.
   ========================================================= */

gsap.registerPlugin(ScrollTrigger);

/* ---------- Device checks & global state ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const speed = reduceMotion ? 0 : 1; // multiplies all hero timings
let lenis = null;

/* ---------- Property data (replace with real listings) ---------- */
const PROPERTIES = [
  {
    name: 'Villa Aurelia', type: 'Villa', location: 'Dubai', price: 18500000,
    beds: 6, baths: 7, sqft: 12500, status: 'For Sale',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'Azure Penthouse', type: 'Penthouse', location: 'Monaco', price: 32000000,
    beds: 4, baths: 5, sqft: 6200, status: 'Exclusive',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'The Cedar Mansion', type: 'Mansion', location: 'Aspen', price: 27500000,
    beds: 8, baths: 9, sqft: 15800, status: 'Off-Market',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'Côte Lumière', type: 'Beach House', location: 'Malibu', price: 14900000,
    beds: 5, baths: 5, sqft: 7400, status: 'For Sale',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'Tagus Sky Residence', type: 'Penthouse', location: 'Lisbon', price: 8900000,
    beds: 3, baths: 3, sqft: 3900, status: 'New Listing',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'Villa Amalfi Terrace', type: 'Villa', location: 'Amalfi', price: 22000000,
    beds: 6, baths: 6, sqft: 9600, status: 'For Sale',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80'
  }
];

const FILTER_IDS = ['f-location', 'f-type', 'f-price'];

/* ---------- Hero elements ---------- */
const heroSection = document.getElementById('hero');
const heroTitles = gsap.utils.toArray('.hero-title');
const heroBgs = gsap.utils.toArray('.hero-bg');
const heroDots = gsap.utils.toArray('.hero-dot');
const heroProgressBar = document.getElementById('hero-progress');
let currentHero = -1;
let heroTween = null;
let heroStarted = false;
let heroTrigger = null;

/* ---------- Form validation rules ---------- */
const FORM_RULES = {
  name: (value) => value.trim().length >= 2 || 'Please enter your full name.',
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Please enter a valid email address.',
  phone: (value) => value.trim() === '' || /^[+\d\s()-]{7,20}$/.test(value.trim()) || 'Please enter a valid phone number.',
  property: (value) => value !== '' || 'Please choose a property.'
};

/* =========================================================
   HELPERS
   ========================================================= */

// Scroll to a Y position, using Lenis when it is running
function scrollToY(y) {
  if (lenis) {
    lenis.scrollTo(y, { duration: 1.4 });
  } else {
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

// Format a number as US dollars, e.g. 18500000 -> "$18,500,000"
function formatPrice(value) {
  return '$' + value.toLocaleString('en-US');
}

// Read from localStorage without crashing when storage is blocked
function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

// Write to localStorage without crashing when storage is blocked
function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    /* storage unavailable: ignore */
  }
}

// Escape text before putting it into an HTML string
function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* =========================================================
   1. SMOOTH SCROLL (LENIS)
   ========================================================= */
function initLenis() {
  if (reduceMotion || typeof Lenis === 'undefined') return;

  lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* =========================================================
   2. PRELOADER
   ========================================================= */
function initPreloader(onDone) {
  const preloader = document.getElementById('preloader');
  if (!preloader) {
    onDone();
    return;
  }

  if (lenis) lenis.stop();

  const finish = () => {
    preloader.style.display = 'none';
    if (lenis) lenis.start();
    onDone();
  };

  gsap.timeline({ onComplete: finish })
    .fromTo('#pre-line', { scaleX: 0 }, { scaleX: 1, duration: 1.3 * speed, ease: 'power2.inOut' })
    .to(preloader, { yPercent: -100, duration: 0.9 * speed, ease: 'power4.inOut' }, '+=0.15');
}

/* =========================================================
   3. NAVBAR (hide on scroll down) & MOBILE MENU & ANCHORS
   ========================================================= */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  let hidden = false;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const menuOpen = document.getElementById('mobile-menu').classList.contains('is-open');
      const shouldHide = self.direction === 1 && self.scroll() > 200 && !menuOpen;
      if (shouldHide === hidden) return;
      hidden = shouldHide;
      gsap.to(navbar, { yPercent: hidden ? -150 : 0, duration: 0.5, ease: 'power3.out', overwrite: true });
    }
  });
}

function initMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const openBtn = document.getElementById('menu-btn');
  const closeBtn = document.getElementById('menu-close');

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && !reduceMotion) {
      gsap.fromTo(menu.querySelectorAll('.mobile-link'), { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out', delay: 0.1 });
    }
  };

  openBtn.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  menu.querySelectorAll('.mobile-link').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
  });
}

// Smooth scroll for in-page links, offset for the fixed navbar
function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href');
    event.preventDefault();
    if (id === '#' || id === '#hero') {
      if (id === '#hero') scrollToY(0);
      return;
    }
    const target = document.querySelector(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 20;
    scrollToY(y);
  });
}

/* =========================================================
   4. THEME TOGGLE (dark / light)
   ========================================================= */
function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const sun = document.getElementById('icon-sun');
  const moon = document.getElementById('icon-moon');
  const meta = document.querySelector('meta[name="theme-color"]');

  const apply = (mode) => {
    const light = mode === 'light';
    root.classList.toggle('light', light);
    sun.classList.toggle('hidden', !light);
    moon.classList.toggle('hidden', light);
    if (meta) meta.setAttribute('content', light ? '#f5f1ea' : '#0a0a0a');
  };

  apply(safeStorageGet('maison-theme') === 'light' ? 'light' : 'dark');

  toggle.addEventListener('click', () => {
    const next = root.classList.contains('light') ? 'dark' : 'light';
    apply(next);
    safeStorageSet('maison-theme', next);
  });
}

/* =========================================================
   5. HERO: pinned, text + background change on scroll
   ========================================================= */
function showHero(index, direction = 1) {
  if (index === currentHero) return;
  const previous = currentHero;
  currentHero = index;

  if (heroTween) heroTween.kill();
  heroTween = gsap.timeline();

  // Background crossfade
  heroBgs.forEach((bg, i) => {
    heroTween.to(bg, { opacity: i === index ? 1 : 0, duration: 1.2 * speed, ease: 'power2.out' }, 0);
  });

  // Hide any title that is not leaving or entering
  heroTitles.forEach((title, i) => {
    if (i !== index && i !== previous) gsap.set(title, { autoAlpha: 0 });
  });

  // Outgoing title: words slide out (up when scrolling down, down when scrolling up)
  if (previous >= 0 && heroTitles[previous]) {
    const outgoing = heroTitles[previous];
    heroTween
      .to(outgoing.querySelectorAll('.word'), {
        yPercent: -110 * direction,
        opacity: 0,
        filter: 'blur(8px)',
        duration: 0.55 * speed,
        stagger: 0.05 * speed,
        ease: 'power3.in'
      }, 0)
      .set(outgoing, { autoAlpha: 0 });
  }

  // Incoming title: words slide in from the opposite side
  const incoming = heroTitles[index];
  heroTween
    .set(incoming, { autoAlpha: 1 }, previous >= 0 ? 0.35 * speed : 0)
    .fromTo(incoming.querySelectorAll('.word'),
      { yPercent: 110 * direction, opacity: 0, filter: 'blur(10px)' },
      { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1 * speed, stagger: 0.08 * speed, ease: 'power4.out' },
      '<');

  // Side dots + mobile counter
  heroDots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  const count = document.getElementById('hero-count');
  if (count) count.textContent = String(index + 1).padStart(2, '0');
}

function heroIndexFromProgress(progress) {
  return Math.min(heroTitles.length - 1, Math.floor(progress * heroTitles.length));
}

function initHero() {
  if (!heroSection || !heroTitles.length) return;

  heroTrigger = ScrollTrigger.create({
    trigger: heroSection,
    start: 'top top',
    end: () => '+=' + window.innerHeight * heroTitles.length,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      if (heroProgressBar) gsap.set(heroProgressBar, { scaleY: self.progress });
      if (!heroStarted) return;
      const index = heroIndexFromProgress(self.progress);
      if (index !== currentHero) showHero(index, self.direction >= 0 ? 1 : -1);
    }
  });

  // Clicking a side dot scrolls to that slide
  heroDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const span = heroTrigger.end - heroTrigger.start;
      scrollToY(heroTrigger.start + span * ((i + 0.5) / heroTitles.length));
    });
  });
}

function startHero() {
  heroStarted = true;
  const index = heroTrigger ? heroIndexFromProgress(heroTrigger.progress) : 0;
  showHero(index, 1);
}

/* =========================================================
   6. TEXT & IMAGE REVEALS, PARALLAX
   ========================================================= */
function splitWords(element) {
  const text = element.textContent.trim().replace(/\s+/g, ' ');
  element.setAttribute('aria-label', text);
  element.innerHTML = text
    .split(' ')
    .map((word) => `<span class="mask" aria-hidden="true"><span class="word">${escapeHTML(word)}</span></span>`)
    .join(' ');
  return element.querySelectorAll('.word');
}

function initReveals() {
  gsap.utils.toArray('[data-split]').forEach((heading) => {
    const words = splitWords(heading);
    if (reduceMotion) return;
    gsap.from(words, {
      yPercent: 110,
      opacity: 0,
      duration: 1.1,
      stagger: 0.06,
      ease: 'power4.out',
      scrollTrigger: { trigger: heading, start: 'top 88%' }
    });
  });

  if (reduceMotion) return;

  gsap.utils.toArray('[data-reveal]').forEach((element) => {
    gsap.from(element, {
      y: 50,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      clearProps: 'transform',
      scrollTrigger: { trigger: element, start: 'top 90%' },
      // Pause CSS transform transitions (hover lifts) while GSAP animates
      onStart: () => { element.style.transition = 'none'; },
      onComplete: () => { element.style.transition = ''; }
    });
  });

  gsap.utils.toArray('[data-wipe]').forEach((element) => {
    gsap.fromTo(element,
      { clipPath: 'inset(100% 0% 0% 0% round 40px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 40px)',
        duration: 1.6,
        ease: 'power4.inOut',
        scrollTrigger: { trigger: element, start: 'top 80%' }
      });
  });

  gsap.utils.toArray('[data-parallax]').forEach((image) => {
    gsap.fromTo(image, { yPercent: -6 }, {
      yPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

/* =========================================================
   7. PROPERTY CARD TEMPLATE
   ========================================================= */
function propertyCard(property, sizeClass) {
  return `
    <article class="property-card group relative ${sizeClass} overflow-hidden rounded-[32px] border border-gold/20 bg-ink" data-cursor="view">
      <div class="relative h-[300px] overflow-hidden md:h-[320px]">
        <img src="${property.image}" alt="${escapeHTML(property.name)}, ${escapeHTML(property.location)}" loading="lazy" class="card-img h-full w-full object-cover" />
        <span class="glass absolute left-5 top-5 rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-[#f5f1ea]">${escapeHTML(property.status)}</span>
      </div>
      <div class="card-details p-6">
        <p class="eyebrow">${escapeHTML(property.location)} · ${escapeHTML(property.type)}</p>
        <h3 class="mt-3 font-serif text-2xl">${escapeHTML(property.name)}</h3>
        <p class="mt-2 font-serif text-xl text-gold">${formatPrice(property.price)}</p>
        <div class="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-gold/15 pt-5 text-[11px] uppercase tracking-[0.15em] text-muted">
          <span>${property.beds} Beds</span>
          <span>${property.baths} Baths</span>
          <span>${property.sqft.toLocaleString('en-US')} Sq Ft</span>
        </div>
        <div class="card-extra">
          <a href="#contact" class="nav-link mt-5 inline-block text-[11px] uppercase tracking-[0.25em] text-gold">Book a viewing →</a>
        </div>
      </div>
    </article>`;
}

/* =========================================================
   8. FEATURED PROPERTIES: horizontal scroll
   ========================================================= */
function initHorizontal() {
  const section = document.getElementById('featured');
  const track = document.getElementById('featured-track');
  track.innerHTML = PROPERTIES.map((property) =>
    propertyCard(property, 'w-[82vw] shrink-0 sm:w-[420px] md:w-[440px]')).join('');

  // Desktop: pin the section and move the track sideways while scrolling down.
  // Mobile: the track is a native swipeable rail (overflow-x-auto).
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  });
}

/* =========================================================
   9. PROPERTY SEARCH & FILTERS
   ========================================================= */
function populateFilters() {
  const locationSelect = document.getElementById('f-location');
  const typeSelect = document.getElementById('f-type');

  const locations = Array.from(new Set(PROPERTIES.map((p) => p.location))).sort();
  const types = Array.from(new Set(PROPERTIES.map((p) => p.type))).sort();

  locationSelect.insertAdjacentHTML('beforeend', locations.map((l) => `<option value="${l}">${l}</option>`).join(''));
  typeSelect.insertAdjacentHTML('beforeend', types.map((t) => `<option value="${t}">${t}</option>`).join(''));
}

// Returns true when a property passes all three filters
function matchesFilter(property, filters) {
  const locationOk = filters.location === 'all' || property.location === filters.location;
  const typeOk = filters.type === 'all' || property.type === filters.type;
  const priceOk = filters.maxPrice === 'all' || property.price <= Number(filters.maxPrice) * 1000000;
  return locationOk && typeOk && priceOk;
}

function renderGrid(list) {
  const grid = document.getElementById('search-grid');
  grid.innerHTML = list.map((property) => propertyCard(property, 'w-full')).join('');

  document.getElementById('result-count').textContent =
    `${list.length} residence${list.length === 1 ? '' : 's'} found`;
  document.getElementById('no-results').classList.toggle('hidden', list.length > 0);

  if (list.length > 0 && !reduceMotion) {
    gsap.from(grid.querySelectorAll('.property-card'), {
      opacity: 0,
      y: 40,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out'
    });
  }
}

function applyFilters() {
  const filters = {
    location: document.getElementById('f-location').value,
    type: document.getElementById('f-type').value,
    maxPrice: document.getElementById('f-price').value
  };
  const results = PROPERTIES.filter((property) => matchesFilter(property, filters));
  renderGrid(results);
}

function initFilters() {
  FILTER_IDS.forEach((id) => {
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  document.getElementById('f-reset').addEventListener('click', () => {
    FILTER_IDS.forEach((id) => {
      document.getElementById(id).value = 'all';
    });
    applyFilters();
  });
}

/* =========================================================
   10. STATS COUNTERS
   ========================================================= */
function initCounters() {
  gsap.utils.toArray('[data-count]').forEach((element) => {
    const target = Number(element.dataset.count);
    const counter = { value: 0 };

    gsap.to(counter, {
      value: target,
      duration: reduceMotion ? 0 : 2.2,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(counter.value).toLocaleString('en-US');
      },
      scrollTrigger: { trigger: element, start: 'top 90%', once: true }
    });
  });
}

/* =========================================================
   11. TESTIMONIALS SLIDER
   ========================================================= */
function initTestimonials() {
  const track = document.getElementById('testi-track');
  const dotsWrap = document.getElementById('testi-dots');
  const viewport = document.getElementById('testi-viewport');
  const slides = Array.from(track.children);
  let index = 0;
  let timer = null;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'h-2 w-2 rounded-full bg-ivory/30 transition-all duration-500';
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    dot.addEventListener('click', () => {
      goTo(i);
      startAuto();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, n) => {
      dot.classList.toggle('bg-gold', n === index);
      dot.classList.toggle('w-6', n === index);
      dot.classList.toggle('bg-ivory/30', n !== index);
      dot.setAttribute('aria-current', n === index ? 'true' : 'false');
    });
    slides.forEach((slide, n) => slide.setAttribute('aria-hidden', n === index ? 'false' : 'true'));
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startAuto() {
    stopAuto();
    if (reduceMotion) return;
    timer = setInterval(() => goTo(index + 1), 6000);
  }

  document.getElementById('testi-prev').addEventListener('click', () => { goTo(index - 1); startAuto(); });
  document.getElementById('testi-next').addEventListener('click', () => { goTo(index + 1); startAuto(); });

  // Pause while hovering, resume on leave
  viewport.addEventListener('mouseenter', stopAuto);
  viewport.addEventListener('mouseleave', startAuto);

  // Swipe on touch screens
  let touchX = null;
  viewport.addEventListener('touchstart', (event) => { touchX = event.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', (event) => {
    if (touchX === null) return;
    const delta = event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 40) {
      goTo(index + (delta < 0 ? 1 : -1));
      startAuto();
    }
    touchX = null;
  });

  goTo(0);
  startAuto();
}

/* =========================================================
   12. GALLERY LIGHTBOX
   ========================================================= */
function initLightbox() {
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const box = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  let current = 0;
  let lastFocus = null;

  const show = (i) => {
    current = (i + items.length) % items.length;
    const thumb = items[current].querySelector('img');
    image.src = items[current].dataset.full;
    image.alt = thumb ? thumb.alt : '';
  };

  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    box.classList.add('is-open');
    if (lenis) lenis.stop();
    closeBtn.focus();
  };

  const close = () => {
    box.classList.remove('is-open');
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };

  items.forEach((item, i) => {
    item.setAttribute('aria-label', 'Open image preview');
    item.addEventListener('click', () => open(i));
  });
  closeBtn.addEventListener('click', close);
  document.getElementById('lightbox-prev').addEventListener('click', () => show(current - 1));
  document.getElementById('lightbox-next').addEventListener('click', () => show(current + 1));
  box.addEventListener('click', (event) => { if (event.target === box) close(); });

  document.addEventListener('keydown', (event) => {
    if (!box.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight') show(current + 1);
    if (event.key === 'ArrowLeft') show(current - 1);
  });
}

/* =========================================================
   13. CONTACT FORM VALIDATION
   ========================================================= */
function validateField(field) {
  const rule = FORM_RULES[field.name];
  if (!rule) return true;

  const result = rule(field.value);
  const ok = result === true;
  const error = document.getElementById(`err-${field.name}`);

  field.setAttribute('aria-invalid', ok ? 'false' : 'true');
  if (error) error.textContent = ok ? '' : result;
  return ok;
}

function initForm() {
  const form = document.getElementById('contact-form');
  const select = document.getElementById('c-property');
  const success = document.getElementById('form-success');

  select.insertAdjacentHTML('beforeend',
    PROPERTIES.map((p) => `<option value="${escapeHTML(p.name)}">${escapeHTML(p.name)} (${escapeHTML(p.location)})</option>`).join('') +
    '<option value="Off-market">Off-market / not sure yet</option>');

  const fields = Object.keys(FORM_RULES).map((name) => form.elements[name]);

  fields.forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    success.classList.add('hidden');

    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length) {
      invalid[0].focus();
      if (!reduceMotion) gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      return;
    }

    const firstName = form.elements.name.value.trim().split(' ')[0];
    success.textContent = `Thank you, ${firstName}. A private advisor will contact you within 24 hours to arrange your viewing of ${form.elements.property.value}.`;
    success.classList.remove('hidden');
    form.reset();
    fields.forEach((field) => field.removeAttribute('aria-invalid'));
    if (!reduceMotion) gsap.from(success, { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out' });
  });
}

/* =========================================================
   14. NEWSLETTER
   ========================================================= */
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');
  const message = document.getElementById('newsletter-msg');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const ok = FORM_RULES.email(input.value) === true;
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    message.className = `mt-3 min-h-[1.25rem] pl-2 text-xs ${ok ? 'text-gold' : 'text-[#e08a8a]'}`;
    message.textContent = ok
      ? 'Welcome to the private list. Your first letter arrives soon.'
      : 'Please enter a valid email address.';
    if (ok) form.reset();
  });
}

/* =========================================================
   15. CUSTOM CURSOR
   ========================================================= */
function initCursor() {
  // Only for mouse/trackpad users on screens where the cursor elements are shown (md+)
  if (!finePointer || !window.matchMedia('(min-width: 768px)').matches) return;

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');
  document.documentElement.classList.add('has-cursor');

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y };

  gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: mouse.x, y: mouse.y, opacity: 0 });
  const dotX = gsap.quickSetter(dot, 'x', 'px');
  const dotY = gsap.quickSetter(dot, 'y', 'px');
  const ringX = gsap.quickSetter(ring, 'x', 'px');
  const ringY = gsap.quickSetter(ring, 'y', 'px');

  window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    dotX(mouse.x);
    dotY(mouse.y);
    gsap.to([dot, ring], { opacity: 1, duration: 0.3, overwrite: 'auto' });
  });

  // Ring follows with a soft delay
  gsap.ticker.add(() => {
    const ease = reduceMotion ? 1 : 0.15;
    ringPos.x += (mouse.x - ringPos.x) * ease;
    ringPos.y += (mouse.y - ringPos.y) * ease;
    ringX(ringPos.x);
    ringY(ringPos.y);
  });

  document.addEventListener('mouseover', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const view = target.closest('[data-cursor="view"]');
    const hover = target.closest('a, button, select, input, textarea, label');
    ring.classList.toggle('is-view', Boolean(view));
    ring.classList.toggle('is-hover', !view && Boolean(hover));
    label.textContent = view ? 'VIEW' : '';
    label.style.opacity = view ? '1' : '0';
  });

  document.documentElement.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));
}

/* =========================================================
   16. MAGNETIC BUTTONS
   ========================================================= */
function initMagnetic() {
  if (!finePointer || reduceMotion) return;

  document.querySelectorAll('.magnetic').forEach((element) => {
    const xTo = gsap.quickTo(element, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(element, 'y', { duration: 0.6, ease: 'power3.out' });

    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect();
      xTo((event.clientX - rect.left - rect.width / 2) * 0.3);
      yTo((event.clientY - rect.top - rect.height / 2) * 0.3);
    });

    element.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/* =========================================================
   17. 3D TILT ON PROPERTY CARDS
   ========================================================= */
function initTilt() {
  if (!finePointer || reduceMotion) return;
  let activeCard = null;

  document.addEventListener('mousemove', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target ? target.closest('.property-card') : null;

    if (activeCard && activeCard !== card) {
      gsap.to(activeCard, { rotateX: 0, rotateY: 0, y: 0, duration: 0.8, ease: 'power3.out' });
    }
    activeCard = card;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(card, {
      rotateY: px * 10,
      rotateX: -py * 10,
      y: -10,
      transformPerspective: 1000,
      duration: 0.6,
      ease: 'power3.out'
    });
  });
}

/* =========================================================
   18. BACK TO TOP (with circular progress ring)
   ========================================================= */
function initBackToTop() {
  const button = document.getElementById('back-to-top');
  const ring = button.querySelector('.progress-ring');
  const circumference = 2 * Math.PI * 22;
  ring.style.strokeDasharray = String(circumference);
  ring.style.strokeDashoffset = String(circumference);

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    ring.style.strokeDashoffset = String(circumference * (1 - progress));
    const show = window.scrollY > window.innerHeight;
    button.classList.toggle('opacity-0', !show);
    button.classList.toggle('pointer-events-none', !show);
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  button.addEventListener('click', () => scrollToY(0));
  update();
}

/* =========================================================
   19. INIT
   ========================================================= */
function init() {
  initLenis();
  initTheme();
  initNavbar();
  initMobileMenu();
  initAnchors();

  // Pinned sections first so later ScrollTriggers measure the right positions
  initHero();
  initHorizontal();

  populateFilters();
  initFilters();
  applyFilters(); // render the search grid on load

  initReveals();
  initCounters();
  initTestimonials();
  initLightbox();
  initForm();
  initNewsletter();
  initCursor();
  initMagnetic();
  initTilt();
  initBackToTop();

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  initPreloader(startHero);

  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

init();
