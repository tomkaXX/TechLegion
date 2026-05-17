/* =========================================================================
   TechLegion Switzerland — main.js
   Language switcher, mobile nav, animations, counters, form helpers.
   ========================================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'tl_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED = ['en', 'de', 'fr', 'it', 'ua'];

  function detectLang() {
    // 1. URL hash like #lang=de
    const hash = window.location.hash.match(/lang=([a-z]{2})/);
    if (hash && SUPPORTED.includes(hash[1])) return hash[1];
    // 2. ?lang= query
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q && SUPPORTED.includes(q)) return q;
    // 3. localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (e) {}
    // 4. browser language
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (nav === 'uk') return 'ua';
    if (SUPPORTED.includes(nav)) return nav;
    return DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
    applyTranslations(lang);
    updateLangSwitcher(lang);
  }

  function applyTranslations(lang) {
    const dict = (window.TL_I18N && window.TL_I18N[lang]) || window.TL_I18N.en;
    const fallback = window.TL_I18N.en;

    // text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = dict[key] || fallback[key];
      if (val !== undefined) {
        if (el.children.length === 0) {
          el.textContent = val;
        } else {
          // preserve children: only replace text nodes
          const firstText = Array.from(el.childNodes).find(n => n.nodeType === 3);
          if (firstText) firstText.nodeValue = val;
          else el.insertBefore(document.createTextNode(val), el.firstChild);
        }
      }
    });

    // attributes (placeholder, title, aria-label, value)
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = dict[key] || fallback[key];
      if (val !== undefined) el.setAttribute('placeholder', val);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const val = dict[key] || fallback[key];
      if (val !== undefined) el.setAttribute('aria-label', val);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = dict[key] || fallback[key];
      if (val !== undefined) el.setAttribute('title', val);
    });
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      const key = el.getAttribute('data-i18n-value');
      const val = dict[key] || fallback[key];
      if (val !== undefined) el.setAttribute('value', val);
    });

    // page title
    const titleKey = document.documentElement.getAttribute('data-page-title-key');
    if (titleKey) {
      const v = dict[titleKey] || fallback[titleKey];
      if (v) document.title = v + ' — TechLegion Switzerland';
    }
  }

  function updateLangSwitcher(currentLang) {
    document.querySelectorAll('.lang-toggle .lang-code').forEach(el => {
      el.textContent = currentLang.toUpperCase();
    });
    document.querySelectorAll('.lang-toggle .lang-flag').forEach(el => {
      const meta = window.TL_LANG_LIST.find(l => l.code === currentLang);
      if (meta) el.textContent = meta.flag;
    });
    document.querySelectorAll('.lang-menu button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
    });
  }

  function buildLangMenu() {
    document.querySelectorAll('.lang-menu').forEach(menu => {
      if (menu.dataset.built) return;
      menu.dataset.built = '1';
      menu.innerHTML = window.TL_LANG_LIST.map(l =>
        `<button type="button" data-lang="${l.code}"><span class="flag">${l.flag}</span><span>${l.name}</span></button>`
      ).join('');
      menu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          setLang(btn.getAttribute('data-lang'));
          menu.classList.remove('open');
        });
      });
    });
  }

  function setupLangToggles() {
    document.querySelectorAll('.lang-toggle').forEach(toggle => {
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        const menu = toggle.parentElement.querySelector('.lang-menu');
        if (menu) menu.classList.toggle('open');
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.lang-menu.open').forEach(m => m.classList.remove('open'));
    });
  }

  /* ---------- Mobile nav ---------- */
  function setupMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => links.classList.toggle('mobile-open'));
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('mobile-open'))
    );
  }

  /* ---------- Active nav link ---------- */
  function highlightActive() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
    });
  }

  /* ---------- Fade-in on scroll ---------- */
  function setupFadeIns() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  function animateCounters() {
    if (!('IntersectionObserver' in window)) return;
    const counters = document.querySelectorAll('[data-counter]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        const target = parseInt(el.getAttribute('data-counter'), 10) || 0;
        const dur = 1400;
        const start = performance.now();
        function step(now) {
          const p = Math.min(1, (now - start) / dur);
          // ease out
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.floor(eased * target);
          el.textContent = val.toLocaleString();
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString() + (el.getAttribute('data-suffix') || '');
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => io.observe(c));
  }

  /* ---------- Form submission feedback ---------- */
  function setupForms() {
    document.querySelectorAll('form[data-form-demo]').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const btn = form.querySelector('[type=submit]');
        const original = btn ? btn.textContent : '';
        if (btn) {
          btn.textContent = '✓ ' + (btn.getAttribute('data-success') || 'Submitted');
          btn.disabled = true;
        }
        const notice = document.createElement('div');
        notice.className = 'form-success';
        notice.style.cssText = 'margin-top:1rem;padding:0.9rem 1rem;border-radius:10px;background:rgba(77,139,255,0.12);border:1px solid var(--border-strong);color:var(--text);font-size:0.92rem;';
        notice.textContent = form.getAttribute('data-success-text') ||
          'Thanks! This is a demo submission. Connect a service like Formspree or Stripe to receive real submissions.';
        form.appendChild(notice);
        setTimeout(() => {
          if (btn) { btn.textContent = original; btn.disabled = false; }
          notice.remove();
        }, 5000);
      });
    });
  }

  /* ---------- Constellation canvas (hero background) ---------- */
  function setupConstellation() {
    const canvas = document.querySelector('.constellation');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, particles = [];

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const target = Math.floor((w * h) / 14000);
      particles = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.4
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      // Lines between near particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const max2 = 130 * 130;
          if (d2 < max2) {
            const alpha = (1 - d2 / max2) * 0.35;
            ctx.strokeStyle = `rgba(125, 211, 255, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // Dots
      ctx.fillStyle = 'rgba(173, 216, 255, 0.85)';
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    let resizeTO;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTO);
      resizeTO = setTimeout(resize, 120);
    });
  }

  /* ---------- Hero parallax (backdrop shifts on scroll) ---------- */
  function setupHeroParallax() {
    const bd = document.querySelector('.hero-backdrop');
    if (!bd) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 600);
        bd.style.transform = `translate3d(0, ${y * 0.25}px, 0) scale(${1 + y * 0.0004})`;
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    buildLangMenu();
    setupLangToggles();
    setupMobileNav();
    highlightActive();
    setupFadeIns();
    animateCounters();
    setupForms();
    setupConstellation();
    setupHeroParallax();
    setLang(detectLang());
  });
})();
