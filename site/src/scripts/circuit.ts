// ============================================================================
// Le circuit — un tracé unique qui relie les points de passage de la page.
// Les waypoints ([data-wp]) sont placés à la main dans les blancs de la mise en page :
// le tracé ne passe jamais sur le texte. Le trait rouge se dessine avec le défilement,
// un marqueur suit la progression et la « tour de chronométrage » sert de navigation.
// ============================================================================

type Pt = { x: number; y: number };
const NS = 'http://www.w3.org/2000/svg';

export function initCircuit() {
  const wps = Array.from(document.querySelectorAll<HTMLElement>('[data-wp]'));
  if (wps.length < 2) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'circuit';
  layer.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg');
  const base = document.createElementNS(NS, 'path');
  const run = document.createElementNS(NS, 'path');
  const halo = document.createElementNS(NS, 'circle');
  const car = document.createElementNS(NS, 'circle');
  base.setAttribute('class', 'circuit__base');
  run.setAttribute('class', 'circuit__run');
  halo.setAttribute('class', 'circuit__halo');
  halo.setAttribute('r', '13');
  car.setAttribute('class', 'circuit__car');
  car.setAttribute('r', '5.5');
  svg.append(base, run, halo, car);
  layer.append(svg);
  document.body.prepend(layer);

  // Secteurs : déplacés dans le calque pour être positionnés en coordonnées de page
  const sectors = Array.from(document.querySelectorAll<HTMLElement>('.sector'));
  sectors.forEach((s) => layer.append(s));

  // Tour de chronométrage
  const tower = buildTower(sectors);

  let total = 0;
  let samples: { y: number; l: number; x: number }[] = [];
  let sectorY: number[] = [];

  function lanes() {
    const vw = document.documentElement.clientWidth;
    const mobile = vw < 900;
    const probe = document.querySelector<HTMLElement>('main .wrap');
    const m = probe ? parseFloat(getComputedStyle(probe).paddingLeft) || 20 : 20;
    const wrapLeft = Math.max(0, (vw - 1520) / 2);
    const left = mobile ? 9 : wrapLeft + m * 0.46;
    const right = mobile ? 9 : vw - wrapLeft - m * 0.62;
    return { vw, mobile, left, right };
  }

  function build() {
    const { vw, mobile, left, right } = lanes();
    const sy = window.scrollY;
    const pts: Pt[] = wps
      .filter((el) => el.offsetParent !== null || el.dataset.wp)
      .map((el) => {
        const r = el.getBoundingClientRect();
        const mode = el.dataset.wp || 'l';
        let x = left;
        if (!mobile) {
          if (mode === 'r') x = right;
          else if (mode === 'self') x = r.left;
          else if (mode === 'selfr') x = r.right;
          else if (mode.endsWith('%')) x = (parseFloat(mode) / 100) * vw;
        }
        return { x: Math.round(x), y: Math.round(r.top + sy) };
      })
      .sort((a, b) => a.y - b.y);

    // Tracé orthogonal : vertical puis horizontal, comme un plan de piste
    const poly: Pt[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = poly[poly.length - 1];
      const q = pts[i];
      if (p.x !== q.x) {
        // on descend jusqu'au niveau du point, puis on traverse
        if (q.y !== p.y) poly.push({ x: p.x, y: q.y });
      }
      poly.push(q);
    }
    const clean = poly.filter((p, i) => i === 0 || p.x !== poly[i - 1].x || p.y !== poly[i - 1].y);
    const d = roundedPath(clean, mobile ? 0 : 110);

    const height = Math.max(...clean.map((p) => p.y)) + 40;
    svg.setAttribute('width', String(vw));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${vw} ${height}`);
    base.setAttribute('d', d);
    run.setAttribute('d', d);
    total = run.getTotalLength();
    run.style.strokeDasharray = `${total} ${total}`;

    samples = [];
    const step = 6;
    for (let l = 0; l <= total; l += step) {
      const p = run.getPointAtLength(l);
      samples.push({ y: p.y, l, x: p.x });
    }
    samples.push({ y: run.getPointAtLength(total).y, l: total, x: run.getPointAtLength(total).x });

    // positionne les secteurs sur le tracé
    sectorY = sectors.map((s) => {
      const target = s.dataset.target ? document.getElementById(s.dataset.target) : null;
      const pad = target ? parseFloat(getComputedStyle(target).paddingTop) || 120 : 120;
      const y = target ? target.getBoundingClientRect().top + sy + Math.min(118, pad * 0.62) + (Number(s.dataset.offset) || 0) : 0;
      const x = xAtY(y);
      s.style.top = `${y}px`;
      if (s.dataset.side === 'r' || x > vw / 2) {
        s.style.left = 'auto';
        s.style.right = `${vw - x - 6.5}px`;
        s.style.flexDirection = 'row-reverse';
      } else {
        s.style.left = `${x - 6.5}px`;
        s.style.right = 'auto';
      }
      s.style.transform = 'translateY(-50%)';
      return y;
    });
    update();
  }

  function xAtY(y: number) {
    let best = samples[0];
    for (const s of samples) { if (s.y <= y + 0.5) best = s; else break; }
    return best ? best.x : 0;
  }

  function lengthAtY(y: number) {
    // le tracé est monotone en y : on prend la dernière longueur atteignant ce niveau
    let lo = 0, hi = samples.length - 1;
    if (y <= samples[0].y) return 0;
    if (y >= samples[hi].y) return total;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (samples[mid].y <= y) lo = mid; else hi = mid - 1;
    }
    // avance sur les segments horizontaux du même niveau
    let i = lo;
    while (i + 1 < samples.length && Math.abs(samples[i + 1].y - samples[i].y) < 0.5) i++;
    return samples[i].l;
  }

  let ticking = false;
  function update() {
    ticking = false;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const targetY = window.scrollY >= max - 2 ? Infinity : window.scrollY + vh * 0.58;
    const len = reduce.matches ? total : lengthAtY(targetY);
    run.style.strokeDashoffset = String(total - len);
    const p = run.getPointAtLength(Math.max(0.01, len));
    car.setAttribute('cx', String(p.x));
    car.setAttribute('cy', String(p.y));
    halo.setAttribute('cx', String(p.x));
    halo.setAttribute('cy', String(p.y));
    const show = !reduce.matches && len > 0 && len < total;
    car.style.opacity = show ? '1' : '0';
    halo.style.opacity = show ? '.35' : '0';

    let current = -1;
    sectorY.forEach((y, i) => {
      const passed = y <= targetY;
      sectors[i].classList.toggle('is-passed', passed);
      if (passed) current = i;
    });
    if (tower) tower.update(current, total ? len / total : 0);
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });

  let rt: number | undefined;
  const rebuild = () => { window.clearTimeout(rt); rt = window.setTimeout(build, 120); };
  window.addEventListener('resize', rebuild);
  new ResizeObserver(rebuild).observe(document.body);
  document.fonts?.ready.then(build);
  window.addEventListener('load', build);
  reduce.addEventListener?.('change', update);
  build();
}

function roundedPath(pts: Pt[], R: number) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], v = pts[i], b = pts[i + 1];
    const la = Math.hypot(v.x - a.x, v.y - a.y);
    const lb = Math.hypot(b.x - v.x, b.y - v.y);
    const r = Math.min(R, la / 2, lb / 2);
    if (r < 1) { d += ` L${v.x} ${v.y}`; continue; }
    const p1 = { x: v.x - ((v.x - a.x) / la) * r, y: v.y - ((v.y - a.y) / la) * r };
    const p2 = { x: v.x + ((b.x - v.x) / lb) * r, y: v.y + ((b.y - v.y) / lb) * r };
    d += ` L${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q${v.x} ${v.y} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last.x} ${last.y}`;
  return d;
}

function buildTower(sectors: HTMLElement[]) {
  if (sectors.length < 3) return null;
  const nav = document.createElement('nav');
  nav.className = 'tower';
  nav.setAttribute('aria-label', 'Progression sur la page');
  const ol = document.createElement('ol');
  const prog = document.createElement('span');
  prog.className = 'prog';
  ol.append(prog);
  const items = sectors.map((s) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.dataset.href || `#${s.dataset.target || ''}`;
    a.innerHTML = `<span>S${s.dataset.sector} · ${s.dataset.name}</span><i></i>`;
    li.append(a);
    ol.append(li);
    return li;
  });
  const lap = document.createElement('div');
  lap.className = 'tower__lap';
  nav.append(ol, lap);
  document.body.append(nav);
  return {
    update(current: number, ratio: number) {
      items.forEach((li, i) => {
        li.classList.toggle('is-passed', i < current);
        li.classList.toggle('is-current', i === current);
        const a = li.querySelector('a');
        if (a) { if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }
      });
      const first = items[0].offsetTop + 8, lastY = items[items.length - 1].offsetTop + 8;
      const curY = current >= 0 ? items[current].offsetTop + 8 : first;
      prog.style.top = `${first}px`;
      prog.style.height = `${Math.max(0, curY - first)}px`;
      lap.textContent = `TOUR · ${String(Math.round(ratio * 100)).padStart(3, '0')} %`;
      void lastY;
    },
  };
}
