/* Winiger Frères : accueil en photos réelles.
   Chaque bloc de texte de l'accueil porte une photo de l'atelier (attributs data-ph, data-srcs, data-wh, data-focus, data-cap).
   Au défilement, les photos se succèdent en plein écran : fondu enchaîné, lent travelling avant, léger relief à la souris.
   Règle de qualité : une photo n'est jamais agrandie au-delà de ce que sa définition permet. Trop petite pour le plein écran,
   elle est posée en tirage sur un fond flou tiré d'elle-même, au lieu d'être étirée.
   Sans ce script (ou en mode « Sans animation »), la page reste en mise en page classique. */
(function () {
  'use strict';
  var doc = document.documentElement;
  if (!doc.classList.contains('ph-on')) return;
  var stage = document.getElementById('ph-stage');
  if (!stage) return;
  var layers = stage.querySelector('.ph-layers');
  var empty = stage.querySelector('.ph-empty');
  var capEl = stage.querySelector('.ph-cap span');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INSTANT = /[?&]instant/.test(location.search);
  var MAX_UP = 1.25; // agrandissement maximal accepté (px affichés / px de la photo)
  var here = document.currentScript && document.currentScript.src;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  // ------------------------------------------------------------ blocs et photos
  var blocks = [].slice.call(document.querySelectorAll('.ch-step[data-ph]')).map(function (el) {
    return { el: el, key: el.getAttribute('data-ph'), cap: el.getAttribute('data-cap') || '', top: 0 };
  });
  if (!blocks.length) return;
  var photos = {};
  blocks.forEach(function (b) {
    var el = b.el;
    if (!b.key || photos[b.key]) return;
    var wh = (el.getAttribute('data-wh') || '1x1').split('x');
    var f = (el.getAttribute('data-focus') || '50% 50%').split(' ');
    photos[b.key] = {
      key: b.key,
      srcs: el.getAttribute('data-srcs').split(',').map(function (s) { var p = s.trim().split(' '); return { url: p[0], w: +p[1] }; }),
      w: +wh[0], h: +wh[1], fx: parseFloat(f[0]) / 100, fy: parseFloat(f[1]) / 100,
      node: null, img: null, plate: null, back: null, loaded: 0, op: -1, geo: null
    };
  });

  function pickSrc(p, cssW) {
    var need = cssW * Math.min(window.devicePixelRatio || 1, 2);
    for (var i = 0; i < p.srcs.length; i++) if (p.srcs[i].w >= need) return p.srcs[i].url;
    return p.srcs[p.srcs.length - 1].url;
  }

  function ensure(p) {
    if (p.node) return;
    var n = document.createElement('div'); n.className = 'ph-photo';
    var back = document.createElement('div'); back.className = 'ph-back';
    var plate = document.createElement('div'); plate.className = 'ph-plate';
    var img = new Image(); img.alt = ''; img.decoding = 'async';
    img.onload = function () { p.ready = true; };
    plate.appendChild(img); n.appendChild(back); n.appendChild(plate); layers.appendChild(n);
    p.node = n; p.img = img; p.plate = plate; p.back = back;
    p.geo = null;
    layout1(p);
    img.src = pickSrc(p, p.geo.dw);
    back.style.backgroundImage = 'url("' + p.srcs[0].url + '")';
  }

  // ------------------------------------------------------------ géométrie
  var W = 0, H = 0, R = null, desktop = true, vh = innerHeight;
  function region() {
    W = stage.clientWidth; H = stage.clientHeight; desktop = W > 900;
    if (desktop) {
      // à droite de la colonne de texte, en laissant la place du rail des chapitres
      var x0 = Math.min(W * 0.5, Math.max(W * 0.4, 660));
      R = { x: x0, y: 36, w: W - x0 - 84, h: H - 72 };
    } else {
      R = { x: 0, y: 0, w: W, h: H * 0.58 };
    }
  }
  function layout1(p) {
    var cover = Math.max(W / p.w, H / p.h);
    var g = {};
    // le sujet resterait-il visible (dans la zone libre) en plein écran ?
    var subjOk = (clamp(R.y + R.h / 2 - p.fy * p.h * cover, H - p.h * cover, 0) + p.fy * p.h * cover) < R.y + R.h * 0.8;
    var rc = Math.max(R.w / p.w, R.h / p.h);
    if (!desktop && !subjOk && rc <= MAX_UP) {
      // téléphone : la photo remplit le haut de l'écran, au-dessus du texte, sujet centré
      g.full = false; g.fill = true;
      g.dw = p.w * rc; g.dh = p.h * rc;
      g.l = clamp(R.w / 2 - p.fx * g.dw, R.w - g.dw, 0); g.t = clamp(R.h / 2 - p.fy * g.dh, R.h - g.dh, 0);
      g.px = R.x; g.py = R.y; g.pw = R.w; g.ph = R.h;
    } else if (cover <= MAX_UP) {
      // plein écran : la photo couvre la scène, le point d'intérêt est centré dans la zone libre
      g.full = true;
      g.dw = p.w * cover; g.dh = p.h * cover;
      var cx = R.x + R.w / 2, cy = R.y + R.h / 2;
      g.l = clamp(cx - p.fx * g.dw, W - g.dw, 0); g.t = clamp(cy - p.fy * g.dh, H - g.dh, 0);
      g.px = 0; g.py = 0; g.pw = W; g.ph = H;
    } else {
      // tirage : la photo garde sa définition, posée dans la zone libre
      g.full = false;
      var s = Math.min(R.w / p.w, R.h / p.h, MAX_UP);
      g.dw = p.w * s; g.dh = p.h * s;
      g.px = R.x + (R.w - g.dw) / 2; g.py = R.y + (R.h - g.dh) / 2; g.pw = g.dw; g.ph = g.dh;
      g.l = 0; g.t = 0;
    }
    p.geo = g;
    if (!p.node) return;
    p.node.classList.toggle('full', g.full);
    p.node.classList.toggle('fill', !!g.fill);
    var ps = p.plate.style;
    ps.left = g.px + 'px'; ps.top = g.py + 'px'; ps.width = g.pw + 'px'; ps.height = g.ph + 'px';
    var is = p.img.style;
    is.width = g.dw + 'px'; is.height = g.dh + 'px'; is.left = g.l + 'px'; is.top = g.t + 'px';
    is.transformOrigin = (p.fx * 100) + '% ' + (p.fy * 100) + '%';
  }

  function measure() {
    vh = innerHeight;
    region();
    var y = scrollY;
    blocks.forEach(function (b) { b.top = b.el.getBoundingClientRect().top + y; });
    Object.keys(photos).forEach(function (k) { var p = photos[k]; if (p.node) layout1(p); });
  }

  // ------------------------------------------------------------ chapitres actifs
  var rail = [].slice.call(document.querySelectorAll('#xp-rail a'));
  var chapters = [].slice.call(document.querySelectorAll('main .ch'));
  var allSteps = [].slice.call(document.querySelectorAll('.ch-step'));
  var activeCh = '';
  function markActive() {
    var mid = scrollY + vh * 0.5, id = '', elId = '';
    chapters.forEach(function (c) { if (mid >= c.getBoundingClientRect().top + scrollY) { id = c.getAttribute('data-ch'); elId = c.id; } });
    if (id !== activeCh) {
      activeCh = id; doc.setAttribute('data-ch', id);
      rail.forEach(function (a) { a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + elId); });
    }
    allSteps.forEach(function (s) {
      var r = s.getBoundingClientRect();
      s.classList.toggle('on', r.top < vh * 0.62 && r.bottom > vh * 0.38);
    });
  }

  // ------------------------------------------------------------ boucle
  var pos = -1, mx = 0, my = 0, tmx = 0, tmy = 0, last = performance.now(), lastCap = null, emptyOp = -1;
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  function runOf(i) {
    // étendue des blocs consécutifs qui montrent la même photo (le travelling continue d'un bloc à l'autre)
    var a = i, b = i, k = blocks[i].key;
    while (a > 0 && blocks[a - 1].key === k) a--;
    while (b < blocks.length - 1 && blocks[b + 1].key === k) b++;
    var end = b + 1 < blocks.length ? blocks[b + 1].top : blocks[b].top + vh * 1.2;
    return { a: blocks[a].top, b: end };
  }

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.1); last = now;
    var target = scrollY + vh * 0.55;
    pos = (pos < 0 || INSTANT || reduce) ? target : pos + (target - pos) * (1 - Math.exp(-dt * 9));
    mx += (tmx - mx) * (1 - Math.exp(-dt * 3)); my += (tmy - my) * (1 - Math.exp(-dt * 3));

    // bloc courant et fondu vers le suivant / depuis le précédent
    var i = 0;
    while (i < blocks.length - 1 && blocks[i + 1].top <= pos) i++;
    var weights = {}, j = -1, f = 0;
    var win = vh * 0.24;
    if (i < blocks.length - 1 && pos > blocks[i + 1].top - win) { j = i + 1; f = (pos - (blocks[i + 1].top - win)) / (2 * win); }
    else if (i > 0 && pos < blocks[i].top + win) { j = i - 1; f = 1 - (pos - (blocks[i].top - win)) / (2 * win); }
    f = smooth(f);
    var wi = 1 - (j >= 0 ? f : 0);
    function add(idx, w) { var k = blocks[idx].key; weights[k] = (weights[k] || 0) + w; }
    add(i, wi); if (j >= 0) add(j, f);

    // chargement anticipé : blocs voisins
    for (var n = Math.max(0, i - 1); n <= Math.min(blocks.length - 1, i + 2); n++) {
      var pk = photos[blocks[n].key]; if (pk) ensure(pk);
    }

    var keys = Object.keys(photos);
    for (var q = 0; q < keys.length; q++) {
      var p = photos[keys[q]];
      if (!p.node) continue;
      var w = weights[p.key] || 0;
      if (p.ready) p.loaded = Math.min(1, p.loaded + dt * 2.5);
      var op = w * smooth(p.loaded);
      if (op <= 0.001) { if (p.op !== 0) { p.node.style.visibility = 'hidden'; p.node.style.opacity = 0; p.op = 0; } continue; }
      if (p.op <= 0) p.node.style.visibility = 'visible';
      p.node.style.opacity = op.toFixed(3); p.op = op;
      // travelling avant sur l'étendue du sujet ; la photo entrante arrive d'un peu plus près
      var idx = blocks[i].key === p.key ? i : j;
      var run = runOf(idx);
      var u = clamp((pos - run.a) / (run.b - run.a), 0, 1);
      var z = 1.04 + (reduce ? 0 : 0.07 * u) + (reduce ? 0 : 0.05 * (1 - w));
      var g = p.geo, amp = reduce ? 0 : 1;
      var ox = -mx * (g.full ? 18 : 10) * amp, oy = -my * (g.full ? 12 : 8) * amp;
      p.img.style.transform = 'translate3d(' + ox.toFixed(1) + 'px,' + oy.toFixed(1) + 'px,0) scale(' + z.toFixed(4) + ')';
      if (!g.full) {
        p.plate.style.transform = 'translate3d(' + (mx * 8 * amp).toFixed(1) + 'px,' + (my * 6 * amp).toFixed(1) + 'px,0)';
        p.back.style.transform = 'translate3d(' + (mx * -22 * amp).toFixed(1) + 'px,' + (my * -16 * amp).toFixed(1) + 'px,0) scale(1.05)';
      }
    }
    var eo = weights[''] || 0;
    if (Math.abs(eo - emptyOp) > 0.001) { empty.style.opacity = eo.toFixed(3); empty.style.visibility = eo > 0.001 ? 'visible' : 'hidden'; emptyOp = eo; }

    var dom = (j >= 0 && f > 0.5) ? blocks[j] : blocks[i];
    var cap = dom.key ? dom.cap : '';
    if (cap !== lastCap) { capEl.textContent = cap; lastCap = cap; }

    if (!document.hidden) requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------ maquette 3D à la demande
  var xb = document.getElementById('xp-explore'), loading = false;
  if (xb && doc.classList.contains('gl')) {
    xb.addEventListener('click', function () {
      if (loading) return; loading = true;
      doc.classList.add('xp-pending');
      var url = new URL('experience.js', here || location.href).href;
      var dyn;
      try { dyn = new Function('u', 'return import(u)'); } catch (e) { dyn = null; }
      if (!dyn) { doc.classList.remove('xp-pending'); doc.classList.add('xp-failed'); return; }
      dyn(url).catch(function (e) {
        console.warn('[3D] chargement impossible :', e);
        doc.classList.remove('xp-pending'); doc.classList.add('xp-failed');
      });
    });
  }

  // ------------------------------------------------------------ démarrage
  measure();
  addEventListener('resize', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  addEventListener('scroll', markActive, { passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { last = performance.now(); requestAnimationFrame(frame); } });
  markActive();
  // première photo chargée tout de suite, en priorité
  var first = photos[blocks[0].key]; if (first) { ensure(first); first.img.fetchPriority = 'high'; }
  requestAnimationFrame(frame);
  doc.classList.add('ph-ready');
  window.__ph = { photos: photos, blocks: blocks };
})();
