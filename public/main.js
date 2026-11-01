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

  /* ---------- Language (EN default, ES via data-es, IT via data-it) ---------- */
  var langButtons = document.querySelectorAll('#langToggle [data-lang]');
  var titles = {
    en: 'Manuel Gutiérrez Torrero · Data & AI Architect',
    es: 'Manuel Gutiérrez Torrero · Arquitecto de Datos e IA',
    it: 'Manuel Gutiérrez Torrero · Architetto Dati e IA'
  };
  function applyLang(lang) {
    if (!titles[lang]) lang = 'en';
    document.querySelectorAll('[data-es]').forEach(function (el) {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = el.dataset[lang] || el.dataset.en;
    });
    root.lang = lang;
    document.title = titles[lang];
    langButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    syncSectionLabel();
  }
  // English by default; a saved choice from the switcher wins
  var savedLang = stored('lang');
  if (savedLang && savedLang !== 'en' && titles[savedLang]) applyLang(savedLang);
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      applyLang(b.dataset.lang);
      store('lang', root.lang);
      if (earlierBtn) syncEarlierBtn();
    });
  });

  /* ---------- Earlier career: expand / collapse all ---------- */
  var earlierBtn = document.getElementById('earlierToggle');
  var earlierItems = document.querySelectorAll('.earlier__item');
  function syncEarlierBtn() {
    var allOpen = Array.prototype.every.call(earlierItems, function (d) { return d.open; });
    earlierBtn.dataset.en = allOpen ? 'Collapse all' : 'Expand all';
    earlierBtn.dataset.es = allOpen ? 'Ocultar todo' : 'Ver todo';
    earlierBtn.dataset.it = allOpen ? 'Comprimi tutto' : 'Espandi tutto';
    earlierBtn.textContent = earlierBtn.dataset[root.lang] || earlierBtn.dataset.en;
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

  /* ---------- Carousels (projects, photos) ---------- */
  function carousel(prefix, itemLabel) {
    var track = document.getElementById(prefix + 'Track');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = document.getElementById(prefix + 'Prev');
    var nextBtn = document.getElementById(prefix + 'Next');
    var countEl = document.getElementById(prefix + 'Count');
    var dotsBox = document.getElementById(prefix + 'Dots');
    var current = 0;

    var dots = slides.map(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', itemLabel + ' ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsBox.appendChild(dot);
      return dot;
    });

    function pos(i) { return slides[i].offsetLeft - slides[0].offsetLeft; }
    // Positions closer than this count as the same, so no click moves the track by just a few pixels
    var NEAR = 16;
    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - NEAR; }

    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: pos(i), behavior: reduceMotion ? 'instant' : 'smooth' });
    }

    // Step from the actual scroll position, not from `current`: when several slides are visible,
    // the slide before the "current" one may already be on screen and scrolling to it does nothing.
    // Both ends wrap around.
    function next() {
      if (atEnd()) return goTo(0);
      var x = track.scrollLeft;
      for (var i = 0; i < slides.length; i++) if (pos(i) > x + NEAR) return goTo(i);
      goTo(0);
    }
    function prev() {
      var x = track.scrollLeft;
      if (x <= NEAR) return goTo(slides.length - 1);
      for (var i = slides.length - 1; i >= 0; i--) if (pos(i) < x - NEAR) return goTo(i);
      goTo(0);
    }

    function update() {
      var x = track.scrollLeft;
      var best = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(pos(i) - x);
        if (d < best) { best = d; current = i; }
      });
      // The last slide can't snap to the start edge, so treat "scrolled to the end" as the last slide
      if (atEnd()) current = slides.length - 1;
      if (countEl) countEl.textContent = (current + 1) + ' / ' + slides.length;
      dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === current)); });
    }

    prevBtn.disabled = nextBtn.disabled = false;
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    update();
  }
  carousel('carousel', 'Project');
  carousel('photos', 'Photo');

  /* ---------- Nav: scrolled state + active section ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu: section selector with the links as a dropdown ---------- */
  var menuBtn = document.getElementById('menuToggle');
  // The selector shows the active section's link text (already translated); About until a section is reached
  function syncSectionLabel() {
    var label = document.getElementById('sectionLabel');
    if (!label) return;
    var active = document.querySelector('.nav__links a.is-active') || document.querySelector('.nav__links a');
    label.innerHTML = active.innerHTML;
  }
  function markActive(href) {
    navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === href); });
    syncSectionLabel();
  }
  function setMenu(open) {
    nav.classList.toggle('is-menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    setMenu(!nav.classList.contains('is-menu-open'));
  });
  // Close after choosing a section, on Escape, or on a tap anywhere else
  document.getElementById('navLinks').addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;
    markActive(link.getAttribute('href'));
    setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-menu-open')) { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#navLinks')) setMenu(false);
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) markActive('#' + entry.target.id);
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

  var revealTargets = document.querySelectorAll('.section h2, .about__body, .job, .tile, .skillset, .creds__col, .photos, .link-card, .stat, .project, .volunteer__card');
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
