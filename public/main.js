(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function stored(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Theme ---------- */
  var themeBtn = document.getElementById('themeToggle');
  function isDark() {
    if (root.dataset.theme) return root.dataset.theme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store('theme', next);
  });

  /* ---------- Language (EN default, ES via data-es) ---------- */
  var langBtn = document.getElementById('langToggle');
  var titles = {
    en: 'Manuel Gutiérrez Torrero · Data & AI Architect',
    es: 'Manuel Gutiérrez Torrero · Arquitecto de Datos e IA'
  };
  function applyLang(lang) {
    document.querySelectorAll('[data-es]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = lang === 'es' ? el.dataset.es : el.dataset.en;
    });
    root.lang = lang;
    document.title = titles[lang];
    langBtn.textContent = lang === 'es' ? 'EN' : 'ES';
    langBtn.setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
  }
  // Saved choice wins; otherwise follow the browser language
  var savedLang = stored('lang');
  var initialLang = savedLang || (/^es\b/i.test(navigator.language || '') ? 'es' : 'en');
  if (initialLang === 'es') applyLang('es');
  langBtn.addEventListener('click', function () {
    var next = root.lang === 'es' ? 'en' : 'es';
    applyLang(next);
    store('lang', next);
  });

  /* ---------- Earlier career: expand / collapse all ---------- */
  var earlierBtn = document.getElementById('earlierToggle');
  var earlierItems = document.querySelectorAll('.earlier__item');
  function syncEarlierBtn() {
    var allOpen = Array.prototype.every.call(earlierItems, function (d) { return d.open; });
    earlierBtn.dataset.en = allOpen ? 'Collapse all' : 'Expand all';
    earlierBtn.dataset.es = allOpen ? 'Ocultar todo' : 'Ver todo';
    earlierBtn.textContent = root.lang === 'es' ? earlierBtn.dataset.es : earlierBtn.dataset.en;
    earlierBtn.setAttribute('aria-expanded', String(allOpen));
  }
  if (earlierBtn) {
    earlierBtn.addEventListener('click', function () {
      var open = earlierBtn.getAttribute('aria-expanded') !== 'true';
      earlierItems.forEach(function (d) { d.open = open; });
      syncEarlierBtn();
    });
    earlierItems.forEach(function (d) { d.addEventListener('toggle', syncEarlierBtn); });
  }

  /* ---------- Nav: scrolled state + active section ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { sectionObs.observe(s); });
  }

  /* ---------- Reveal + counters ---------- */
  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    var original = el.textContent;
    if (reduceMotion || !target) return;
    var start = null;
    var duration = 1200;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = original.replace(/\d+/, Math.round(eased * target));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var revealTargets = document.querySelectorAll('.section h2, .about__body, .job, .tile, .skillset, .creds__col, .gallery figure, .link-card, .stat, .sandbox__text, .term, .volunteer__card');
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- Hero data graph ---------- */
  var canvas = document.getElementById('graph');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var nodes = [];
  var w = 0, h = 0, dpr = 1, rgb = '45, 212, 191';
  var running = true;

  function readColor() {
    rgb = getComputedStyle(root).getPropertyValue('--graph').trim() || rgb;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.round(Math.min(70, (w * h) / 16000));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var max = 140;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < max) {
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.35 * (1 - d / max)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(' + rgb + ',0.8)';
    nodes.forEach(function (n) {
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });
  }

  function step() {
    if (!running) return;
    nodes.forEach(function (n) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });
    draw();
    requestAnimationFrame(step);
  }

  readColor();
  resize();
  if (reduceMotion) {
    draw();
  } else {
    // Pause the animation when the hero is off screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var visible = entries[0].isIntersecting;
        if (visible && !running) { running = true; requestAnimationFrame(step); }
        running = visible;
      }).observe(canvas);
    }
    requestAnimationFrame(step);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); if (reduceMotion) draw(); }, 150);
  });
  new MutationObserver(function () { readColor(); if (reduceMotion) draw(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColor(); if (reduceMotion) draw(); });
})();
