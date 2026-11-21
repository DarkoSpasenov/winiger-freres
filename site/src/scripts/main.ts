import { initCircuit } from './circuit';

// --- Révélations au défilement (masques géométriques) ---
function initReveal() {
  const els = document.querySelectorAll<HTMLElement>('[data-mask], [data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}

// --- En-tête : bordure au défilement, masqué en descendant ---
function initHeader() {
  const h = document.querySelector<HTMLElement>('.site-header');
  if (!h) return;
  let last = window.scrollY;
  const menuOpen = () => document.documentElement.classList.contains('menu-open');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    h.classList.toggle('is-scrolled', y > 8);
    if (!menuOpen()) h.classList.toggle('is-hidden', y > last && y > 400);
    last = y;
  }, { passive: true });
  h.addEventListener('focusin', () => h.classList.remove('is-hidden'));
}

// --- Menu mobile ---
function initMenu() {
  const btn = document.querySelector<HTMLButtonElement>('.burger');
  const panel = document.getElementById('mnav');
  if (!btn || !panel) return;
  const set = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    panel.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) panel.querySelector<HTMLElement>('a')?.focus();
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  panel.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) set(false); });
}

// --- Horaires : jour courant (heure suisse) ---
function initHours() {
  const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Zurich' }).format(new Date());
  const row = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 1, Sat: 2, Sun: 3 }[day as 'Mon'];
  document.querySelectorAll('[data-hours] tr').forEach((tr) => {
    if (Number((tr as HTMLElement).dataset.day) === row) { tr.classList.add('is-today'); tr.setAttribute('aria-current', 'date'); }
  });
}

// --- Index des prestations : aperçu photo au survol (desktop) ---
function initServiceIndex() {
  document.querySelectorAll<HTMLElement>('[data-index]').forEach((root) => {
    const frames = root.querySelectorAll<HTMLElement>('[data-preview]');
    const rows = root.querySelectorAll<HTMLElement>('[data-row]');
    const show = (id: string) => {
      frames.forEach((f) => f.classList.toggle('is-active', f.dataset.preview === id));
      rows.forEach((r) => r.classList.toggle('is-active', r.dataset.row === id));
    };
    rows.forEach((r) => {
      r.addEventListener('mouseenter', () => show(r.dataset.row!));
      r.addEventListener('focusin', () => show(r.dataset.row!));
    });
  });
}

// --- Formulaire de contact ---
function initForm() {
  document.querySelectorAll<HTMLFormElement>('form[data-contact]').forEach((form) => {
    const status = form.querySelector<HTMLElement>('.form-status');
    const endpoint = form.dataset.endpoint?.trim();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      if (data.get('website')) return; // pot de miel anti-spam
      const subject = `[Site] ${data.get('sujet') || 'Demande'} — ${data.get('nom')}`;
      const body = [
        `Nom : ${data.get('nom')}`,
        `Téléphone : ${data.get('tel') || '—'}`,
        `E-mail : ${data.get('email')}`,
        `Véhicule : ${data.get('vehicule') || '—'}`,
        `Sujet : ${data.get('sujet')}`,
        '',
        String(data.get('message') || ''),
      ].join('\n');

      if (!endpoint) {
        // Aucun service d'envoi n'est encore configuré : on prépare l'e-mail dans la messagerie du visiteur.
        window.location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        if (status) { status.dataset.state = 'ok'; status.textContent = 'Votre messagerie s’ouvre avec le message prérempli : il ne reste qu’à l’envoyer.'; }
        return;
      }
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      btn?.setAttribute('disabled', '');
      try {
        const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        if (status) { status.dataset.state = 'ok'; status.textContent = 'Merci, votre message a bien été envoyé. Nous vous répondons rapidement.'; }
      } catch {
        if (status) { status.dataset.state = 'err'; status.textContent = 'L’envoi a échoué. Appelez-nous au 026 476 06 06 ou écrivez à carrosserie@winiger-artcar.ch.'; }
      } finally { btn?.removeAttribute('disabled'); }
    });
  });
}

// --- Galerie : visionneuse accessible ---
function initLightbox() {
  const dlg = document.querySelector<HTMLDialogElement>('#lightbox');
  if (!dlg) return;
  const items = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-lightbox]'));
  const img = dlg.querySelector('img')!;
  const cap = dlg.querySelector('.lb-cap')!;
  const count = dlg.querySelector('.lb-count')!;
  let i = 0;
  const show = (n: number) => {
    i = (n + items.length) % items.length;
    const a = items[i];
    img.src = a.href;
    img.alt = a.querySelector('img')?.alt || '';
    cap.textContent = img.alt;
    count.textContent = `${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
  };
  items.forEach((a, n) => a.addEventListener('click', (e) => { e.preventDefault(); show(n); dlg.showModal(); }));
  dlg.querySelector('.lb-prev')?.addEventListener('click', () => show(i - 1));
  dlg.querySelector('.lb-next')?.addEventListener('click', () => show(i + 1));
  dlg.querySelector('.lb-close')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
}

initReveal();
initHeader();
initMenu();
initHours();
initServiceIndex();
initForm();
initLightbox();
initCircuit();
