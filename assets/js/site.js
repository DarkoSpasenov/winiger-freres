/* Winiger Frères — scripts V4 : menu mobile, apparitions, dossier 911, formulaire de démonstration */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) root.classList.add('reduce');

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('menu');
  if (burger && nav) {
    var setOpen = function (open, focusBack) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      nav.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
      else if (focusBack) burger.focus();
    };
    burger.addEventListener('click', function () { setOpen(burger.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false, true);
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    window.matchMedia('(min-width: 981px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
    /* Garde le focus dans le menu ouvert */
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !nav.classList.contains('open')) return;
      var items = nav.querySelectorAll('a');
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); burger.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); burger.focus(); }
    });
    burger.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey && nav.classList.contains('open')) { e.preventDefault(); nav.querySelector('a').focus(); }
    });
  }

  /* ---------- Apparitions au défilement ---------- */
  var rv = document.querySelectorAll('.rv');
  if (!reduce.matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Dossier 911 : l'image suit l'étape lue ---------- */
  var steps = document.querySelectorAll('.step');
  var figs = document.querySelectorAll('.stage figure');
  var count = document.querySelector('[data-count]');
  if (steps.length && figs.length && 'IntersectionObserver' in window) {
    var show = function (i) {
      figs.forEach(function (f) { f.classList.toggle('on', f.dataset.step === String(i)); });
      steps.forEach(function (s) { s.classList.toggle('on', s.dataset.step === String(i)); });
      if (count) count.textContent = Number(i) + 1;
    };
    show(0);
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) show(en.target.dataset.step); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* ---------- Lien vers une section : placer le focus sur son titre ---------- */
  function focusTarget() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id || id.indexOf('demande') === 0) return;
    var t = document.getElementById(id);
    if (t && t.hasAttribute('tabindex')) t.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', focusTarget);

  /* ---------- Formulaire de demande (démonstration) ---------- */
  var form = document.getElementById('demande');
  if (form) {
    var objet = document.getElementById('f-objet');
    var duree = document.getElementById('duree-field');
    var status = document.getElementById('form-status');
    var syncDuree = function () { duree.hidden = objet.value !== 'gardiennage'; };

    var preselect = function () {
      var h = decodeURIComponent(location.hash.slice(1));
      if (h.indexOf('demande') !== 0) return;
      var key = h.replace(/^demande-?/, '');
      if (key && objet.querySelector('option[value="' + key + '"]')) objet.value = key;
      syncDuree();
      form.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      form.focus({ preventScroll: true });
    };
    objet.addEventListener('change', syncDuree);
    window.addEventListener('hashchange', preselect);
    preselect();

    var rules = [
      ['f-nom', 'e-nom', function (v) { return v.trim().length > 1; }, 'Indiquez votre nom.'],
      ['f-tel', 'e-tel', function (v) { return /[0-9]{6,}/.test(v.replace(/[\s.+()-]/g, '')); }, 'Indiquez un numéro de téléphone valable.'],
      ['f-mail', 'e-mail', function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, 'Cette adresse e-mail ne semble pas valable.'],
      ['f-objet', 'e-objet', function (v) { return !!v; }, "Choisissez l'objet de votre demande."],
      ['f-msg', 'e-msg', function (v) { return v.trim().length > 4; }, 'Décrivez brièvement votre demande.'],
      ['f-ok', 'e-ok', function (v, el) { return el.checked; }, 'Votre accord est nécessaire pour traiter la demande.']
    ];
    var check = function (r) {
      var el = document.getElementById(r[0]), err = document.getElementById(r[1]);
      var ok = r[2](el.value, el);
      el.setAttribute('aria-invalid', String(!ok));
      if (ok) { err.hidden = true; el.removeAttribute('aria-describedby'); }
      else { err.textContent = r[3]; err.hidden = false; el.setAttribute('aria-describedby', r[1]); }
      return ok;
    };
    rules.forEach(function (r) {
      var el = document.getElementById(r[0]);
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'blur', function () {
        if (el.getAttribute('aria-invalid') !== null) check(r);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      rules.forEach(function (r) { if (!check(r) && !firstBad) firstBad = document.getElementById(r[0]); });
      if (firstBad) { status.hidden = true; firstBad.focus(); return; }
      /* Aucun envoi : le formulaire n'est relié à aucun service. Le branchement se fait ici (voir README). */
      status.innerHTML = '<b>Demande complète, mais non envoyée.</b> Ce formulaire est une démonstration : rien n’a été transmis à l’atelier. ' +
        'Pour cette demande, appelez le <a href="tel:+41264760606">026 476 06 06</a> ou écrivez à ' +
        '<a href="mailto:carrosserie@winiger-artcar.ch">carrosserie@winiger-artcar.ch</a>.';
      status.hidden = false;
    });
  }

  /* ---------- Accueil : bouton « Version sans 3D » / « Activer la 3D » ---------- */
  var tg = document.getElementById('xp-toggle');
  if (tg) {
    var off = root.classList.contains('xp-off');
    tg.textContent = off ? tg.dataset.off : tg.dataset.on;
    if (root.classList.contains('xp-failed')) tg.hidden = true;
    tg.addEventListener('click', function () {
      try { if (off) localStorage.removeItem('wf3d'); else localStorage.setItem('wf3d', 'off'); } catch (e) {}
      location.reload();
    });
  }
})();
