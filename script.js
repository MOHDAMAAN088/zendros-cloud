/* ================================================================
   ZENDROS — script.js
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. UTILITY: debounce
   ---------------------------------------------------------------- */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ----------------------------------------------------------------
   2. HERO CANVAS — animated infrastructure topology
      Draws pulsing nodes connected by faint lines,
      suggesting a live Kubernetes cluster
   ---------------------------------------------------------------- */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, nodes, animFrame;

  /* Colour constants */
  const INDIGO = { r: 99,  g: 102, b: 241 };
  const CYAN   = { r: 34,  g: 211, b: 238 };

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpColor(c1, c2, t) {
    return `rgba(${Math.round(lerp(c1.r, c2.r, t))},${Math.round(lerp(c1.g, c2.g, t))},${Math.round(lerp(c1.b, c2.b, t))},`;
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    buildNodes();
  }

  function buildNodes() {
    const count = Math.max(18, Math.min(36, Math.floor((W * H) / (120000 * window.devicePixelRatio ** 2))));
    nodes = Array.from({ length: count }, () => ({
      x:   Math.random() * W,
      y:   Math.random() * H,
      vx:  (Math.random() - 0.5) * 0.35,
      vy:  (Math.random() - 0.5) * 0.35,
      r:   Math.random() * 2.5 + 1.5,
      t:   Math.random() * Math.PI * 2,   /* phase offset */
      kind: Math.random() < 0.2 ? 'hub' : 'node', /* hubs are larger */
    }));
  }

  const CONNECT_DIST = 210 * window.devicePixelRatio;

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);

    /* Update positions */
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      n.t += 0.012;
    }

    /* Draw edges */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d > CONNECT_DIST) continue;

        const alpha = (1 - d / CONNECT_DIST) * 0.18;
        const t     = i / nodes.length;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = lerpColor(INDIGO, CYAN, t) + alpha + ')';
        ctx.lineWidth   = 1;
        ctx.stroke();
      }
    }

    /* Draw nodes */
    for (let i = 0; i < nodes.length; i++) {
      const n     = nodes[i];
      const pulse = Math.sin(n.t) * 0.5 + 0.5;
      const t     = i / nodes.length;
      const base  = n.kind === 'hub' ? n.r * 2.4 : n.r;
      const glow  = base + pulse * (n.kind === 'hub' ? 6 : 3);

      /* Glow */
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glow * 3);
      grad.addColorStop(0,   lerpColor(INDIGO, CYAN, t) + (pulse * 0.35) + ')');
      grad.addColorStop(1,   lerpColor(INDIGO, CYAN, t) + '0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, glow * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      /* Core dot */
      ctx.beginPath();
      ctx.arc(n.x, n.y, base, 0, Math.PI * 2);
      ctx.fillStyle = lerpColor(INDIGO, CYAN, t) + (0.55 + pulse * 0.35) + ')';
      ctx.fill();
    }

    animFrame = requestAnimationFrame(draw);
  }

  /* Start */
  resize();
  animFrame = requestAnimationFrame(draw);
  window.addEventListener('resize', debounce(resize, 200));

  /* Pause when tab hidden */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animFrame);
    else animFrame = requestAnimationFrame(draw);
  });
})();

/* ----------------------------------------------------------------
   3. NAVIGATION: scroll class + active link highlighting
   ---------------------------------------------------------------- */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const onScroll = debounce(() => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, 50);

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Hamburger toggle */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });

    /* Close menu on link click */
    mobileMenu.querySelectorAll('.nav__mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

/* ----------------------------------------------------------------
   4. SCROLL REVEAL — IntersectionObserver
   ---------------------------------------------------------------- */
(function initReveal() {
  /* Skip if user prefers reduced motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  /* Stagger children in grids */
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 6) * 70}ms`;
    observer.observe(el);
  });
})();

/* ----------------------------------------------------------------
   5. CONTACT FORM — client-side validation + submission hook
   ---------------------------------------------------------------- */
(function initContactForm() {
  const form        = document.getElementById('contactForm');
  const submitBtn   = document.getElementById('submitBtn');
  const formSuccess = document.getElementById('formSuccess');
  if (!form) return;

  /* Simple field validation */
  function validateField(input) {
    const val = input.value.trim();
    if (input.required && !val) return 'This field is required.';
    if (input.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  function showError(input, msg) {
    clearError(input);
    input.style.borderColor = '#f87171';
    const err = document.createElement('span');
    err.className = 'form-error';
    err.style.cssText = 'font-size:0.8125rem;color:#f87171;margin-top:0.25rem;display:block;';
    err.textContent = msg;
    input.parentElement.appendChild(err);
  }

  function clearError(input) {
    input.style.borderColor = '';
    const prev = input.parentElement.querySelector('.form-error');
    if (prev) prev.remove();
  }

  /* Inline validation on blur */
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('blur', () => {
      const err = validateField(input);
      if (err) showError(input, err);
      else clearError(input);
    });
    input.addEventListener('input', () => clearError(input));
  });

  /* Submission */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* Validate all fields */
    let hasError = false;
    form.querySelectorAll('.form-input').forEach(input => {
      const err = validateField(input);
      if (err) { showError(input, err); hasError = true; }
    });
    if (hasError) return;

    /* Disable button + show loading */
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector('.btn__text');
    btnText.textContent = 'Sending…';

    /* ── BACKEND HOOK ───────────────────────────────────────────────
       Replace the URL and payload below when you add a backend.
       e.g. Formspree, Netlify Forms, or your own Express/FastAPI endpoint.

       Example:
       const res = await fetch('https://your-backend.com/contact', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(Object.fromEntries(new FormData(form))),
       });
       if (!res.ok) throw new Error('Server error');
    ─────────────────────────────────────────────────────────────── */

    /* Simulated delay for demo — remove when integrating real backend */
    await new Promise(resolve => setTimeout(resolve, 1200));

    /* Show success state */
    form.hidden      = true;
    formSuccess.hidden = false;
  });
})();

/* ----------------------------------------------------------------
   6. BACK TO TOP BUTTON
   ---------------------------------------------------------------- */
(function initBackTop() {
  const btn = document.getElementById('backTop');
  if (!btn) return;

  const onScroll = debounce(() => {
    btn.hidden = window.scrollY < 500;
  }, 100);

  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ----------------------------------------------------------------
   7. SMOOTH ACTIVE NAV LINK — highlight nav item in viewport
   ---------------------------------------------------------------- */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__link:not(.nav__link--cta)');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.style.color = active ? 'var(--text-1)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
})();

/* ----------------------------------------------------------------
   8. FOOTER YEAR
   ---------------------------------------------------------------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ----------------------------------------------------------------
   9. STAGGERED TECH CARD HOVER — subtle scale micro-interaction
   ---------------------------------------------------------------- */
document.querySelectorAll('.tech-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.setProperty('--hover-scale', '1.04');
  });
  card.addEventListener('mouseleave', () => {
    card.style.removeProperty('--hover-scale');
  });
});

/* ----------------------------------------------------------------
   10. LAZY GRADIENT TEXT SHIMMER on hero headline (one-shot on load)
   ---------------------------------------------------------------- */
(function initShimmer() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const gradText = document.querySelector('.hero__headline-gradient');
  if (!gradText) return;

  /* Add keyframe animation dynamically */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .hero__headline-gradient {
      background: linear-gradient(135deg, #6366F1, #22D3EE, #a5b4fc, #6366F1);
      background-size: 300% 300%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 6s ease infinite;
    }
  `;
  document.head.appendChild(style);
})();
