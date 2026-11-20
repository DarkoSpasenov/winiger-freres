// Winiger Frères : expérience 3D de la page d'accueil.
// Scène Three.js générée dans le navigateur, pilotée par le défilement ; mode exploration libre (rotation, zoom).
// Si quoi que ce soit échoue, la page reste entièrement lisible (contenu HTML + photos).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildWorld, setFade } from './building.js';
import { collectStatic, exportStatic, applyBake, guardShared } from './bake.js';
import { SHOTS, PLACES } from './story.js';
import { Spray } from './fx.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const doc = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const range = (p, a, b) => clamp((p - a) / (b - a));
const INSTANT = /[?&]instant/.test(location.search); // tests automatisés : pas de lissage de caméra
// Mode photo : l'accueil défile dans les vraies photos ; la maquette n'est chargée qu'à la demande, pour l'exploration libre.
const PHOTO = doc.classList.contains('ph-on');

function fail(err) {
  console.warn('[3D] désactivée :', err);
  doc.classList.remove('xp-pending', 'xp-on', 'xp-exploring');
  doc.classList.add('xp-failed');
}

// La 3D ne démarre que si le test du <head> l'a autorisée (WebGL présent, pas de préférence « sans 3D »).
if (doc.classList.contains('xp-pending')) { try { start(); } catch (e) { fail(e); } }

function start() {
  const stage = $('#xp-stage');
  const canvas = $('#xp-canvas');
  if (!stage || !canvas) return;
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- rendu
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  let dprMax = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  let dpr = dprMax;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  // Ciel physique (diffusion atmosphérique) : il éclaire et se reflète sur les carrosseries et les vitrages.
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 38), THREE.MathUtils.degToRad(-42));
  const sky = new Sky();
  sky.scale.setScalar(300);
  const su = sky.material.uniforms;
  su.turbidity.value = 4.5; su.rayleigh.value = 1.2; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.85;
  su.sunPosition.value.copy(sunDir);
  const envScene = new THREE.Scene(); envScene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0).texture;
  scene.environmentIntensity = 0.9;
  // éclairage d'ambiance photographique : HDRI « Pedestrian Overpass » de Poly Haven (CC0), reflets réels sur carrosseries et vitrages
  const hdrUrl = stage.dataset.hdr || 'assets/hdr/pedestrian_overpass_1k.hdr';
  // variante base64 (.b64.txt) pour les hébergements qui ne servent pas les fichiers binaires .hdr
  const hdrSrc = hdrUrl.endsWith('.b64.txt') ? fetch(hdrUrl).then((r) => r.text()).then((t) => 'data:application/octet-stream;base64,' + t.trim()) : Promise.resolve(hdrUrl);
  hdrSrc.then((u) => new HDRLoader().load(u, (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const px = hdr.image.data; // désature l'HDRI (lumière neutre, sans dominante chaude)
    const h = THREE.DataUtils.fromHalfFloat, t = THREE.DataUtils.toHalfFloat;
    for (let i = 0; i < px.length; i += 4) { const r = h(px[i]), g = h(px[i + 1]), b = h(px[i + 2]), l = r * 0.2126 + g * 0.7152 + b * 0.0722; px[i] = t(l + (r - l) * 0.25); px[i + 1] = t(l + (g - l) * 0.25); px[i + 2] = t(l + (b - l) * 0.25); }
    hdr.needsUpdate = true;
    const env = pmrem.fromEquirectangular(hdr).texture; hdr.dispose();
    scene.environment = env; scene.environmentIntensity = 0.6;
  })).catch(() => {});
  envScene.remove(sky);
  scene.add(sky); // le même ciel sert de fond
  const BG = new THREE.Color(0xc9d3dc);
  scene.fog = new THREE.Fog(BG, 140, 420);

  const camera = new THREE.PerspectiveCamera(mobile ? 50 : 38, 1, 0.3, 600);

  const hemi = new THREE.HemisphereLight(0xdfe9f3, 0x6b6a5e, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6ec, 3.0);
  sun.position.copy(sunDir).multiplyScalar(90);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 4096, mobile ? 1024 : 4096);
  sun.shadow.radius = 3;
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 55, bottom: -55, near: 20, far: 200 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  sun.target.position.set(0, 0, 4);
  scene.add(sun, sun.target);

  // Occlusion ambiante (ombres de contact dans les angles, sous les voitures) : sur ordinateur seulement.
  let composer = null, gtao = null;
  if (!mobile) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    gtao = new GTAOPass(scene, camera, 1, 1);
    gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
    composer.addPass(new OutputPass());
  }

  const logoUrl = stage.dataset.logo || 'assets/img/logo-winiger-960.webp';
  const { root, W, anchors, zones } = buildWorld({ logoUrl, mobile, carUrl: stage.dataset.car || undefined, clientCarUrl: stage.dataset.clientCar || undefined });
  scene.add(root);
  // éclairage précalculé dans Blender (Cycles) pour les éléments fixes
  const statics = collectStatic(root, W);
  let bakedK = 1; // part des éclairages intérieurs encore calculée en temps réel
  if (/[?&]bakeexport/.test(location.search)) {
    window.__bakeExport = () => exportStatic(statics, {
      sun: sunDir.toArray(),
      lights: Object.fromEntries(Object.entries(W.lights).map(([k, l]) => [k, l.getWorldPosition(new THREE.Vector3()).toArray()])),
    });
  } else if (stage.dataset.bake !== 'off' && !/[?&]nobake/.test(location.search)) {
    const hemiChunk = THREE.ShaderChunk.lights_fragment_begin.replace('irradiance += getHemisphereLightIrradiance', 'irradiance += 0.0 * getHemisphereLightIrradiance');
    const mapsChunk = THREE.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );', '');
    applyBake(statics, stage.dataset.bakeBase || 'assets/bake/', {
      onMaterial: (m) => {
        // la lightmap remplace le ciel diffus (déjà cuit, avec ses ombres) ; les reflets restent en temps réel
        m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', hemiChunk).replace('#include <lights_fragment_maps>', mapsChunk); };
        m.customProgramCacheKey = () => 'baked';
      },
    }).then((mats) => { if (mats) { guardShared(root, mats); bakedK = 0.2; doc.classList.add('xp-baked'); } }).catch((e) => console.warn('bake', e));
  }

  const water = new Spray({ count: mobile ? 350 : 900, color: 0xdcecff, size: 0.07, speed: 7.5, spread: 0.07, life: 0.55, opacity: 0.75 });
  const mist = new Spray({ count: mobile ? 250 : 600, color: 0xd7202a, size: 0.16, speed: 2.4, spread: 0.35, life: 0.9, gravity: -0.4, opacity: 0.22 });
  scene.add(water.points, mist.points);

  // Survol des espaces
  const hover = new THREE.Box3Helper(new THREE.Box3(), 0xde0410);
  hover.visible = false; scene.add(hover);

  // ---------------------------------------------------------------- chapitres et défilement
  const chapters = $$('.ch[data-ch]').map((el) => ({ el, id: el.dataset.ch, steps: $$('.ch-step', el) }));
  let keys = [];
  let vh = innerHeight;
  // Centre (en coordonnées de défilement) de chaque bloc d'un chapitre ; s fractionnaire = interpolation.
  function blockAt(c, s) {
    const b = c.blocks;
    if (s <= 0) return b[0].mid + s * b[0].h;
    const i = Math.floor(s);
    if (i >= b.length - 1) return b[b.length - 1].mid + (s - (b.length - 1)) * b[b.length - 1].h;
    return lerp(b[i].mid, b[i + 1].mid, s - i);
  }
  function layout() {
    vh = innerHeight;
    keys = [];
    let prev = {};
    for (const c of chapters) {
      const r = c.el.getBoundingClientRect();
      c.top = r.top + scrollY; c.h = r.height;
      const els = c.steps.length ? c.steps : [c.el];
      c.blocks = els.map((e) => { const q = e.getBoundingClientRect(); return { mid: q.top + scrollY + q.height / 2, h: q.height }; });
      for (const sh of SHOTS[c.id] || []) {
        const k = { ...prev, ...sh, at: blockAt(c, sh.s) };
        delete k.s; keys.push(k); prev = k;
      }
    }
    keys.sort((a, b) => a.at - b.at);
  }
  // Position continue dans un chapitre, en blocs (0 = intro, 1 = 1re étape...).
  function stepPos(id) {
    const c = chapters.find((x) => x.id === id);
    if (!c || !c.blocks) return -1;
    const m = scrollY + vh * 0.5, b = c.blocks;
    if (m <= b[0].mid) return (m - b[0].mid) / b[0].h;
    for (let i = 0; i < b.length - 1; i++) if (m <= b[i + 1].mid) return i + (m - b[i].mid) / (b[i + 1].mid - b[i].mid);
    return b.length - 1 + (m - b[b.length - 1].mid) / b[b.length - 1].h;
  }

  const cur = { pos: new THREE.Vector3(...SHOTS.hero[0].pos), tgt: new THREE.Vector3(...SHOTS.hero[0].tgt), open: 0, cut: 0, ext: 0, dim: 0 };
  const want = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), open: 0, cut: 0, ext: 0, dim: 0 };
  const ta = new THREE.Vector3(), tb = new THREE.Vector3();
  function sample(s) {
    if (!keys.length) return;
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].at <= s) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const u = a === b || s <= a.at ? 0 : smooth((s - a.at) / (b.at - a.at));
    want.pos.copy(ta.set(...a.pos)).lerp(tb.set(...b.pos), u);
    want.tgt.copy(ta.set(...a.tgt)).lerp(tb.set(...b.tgt), u);
    for (const k of ['open', 'cut', 'ext', 'dim']) want[k] = lerp(a[k] ?? 0, b[k] ?? a[k] ?? 0, u);
  }
  // ---------------------------------------------------------------- repères cliquables (HTML, accessibles au clavier)
  const pinLayer = $('#xp-pins');
  const pins = Object.entries(anchors).filter(([id]) => PLACES[id] || id === 'cabine').map(([id, v]) => {
    const target = id === 'cabine' ? 'carrosserie' : id;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'xp-pin';
    b.setAttribute('aria-label', (id === 'cabine' ? 'Cabine de peinture' : PLACES[id].label) + ' : aller à cet espace');
    b.innerHTML = `<span class="xp-pin-dot"></span><span class="xp-pin-label">${id === 'cabine' ? 'Cabine de peinture' : PLACES[id].label}</span>`;
    b.addEventListener('click', () => goTo(target, id === 'cabine' ? 3 : 0));
    pinLayer && pinLayer.appendChild(b);
    return { id, v, b };
  });
  const tv = new THREE.Vector3();
  function placePins(show) {
    if (!pinLayer) return;
    pinLayer.classList.toggle('on', show);
    if (!show) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    for (const p of pins) {
      tv.copy(p.v);
      if (p.id === 'gardiennage' && cur.cut < 0.5 && !exploring) tv.y = 0.5; // sous-sol : repère posé au niveau du sol
      tv.project(camera);
      const vis = tv.z < 1 && Math.abs(tv.x) < 0.95 && Math.abs(tv.y) < 0.92;
      p.b.style.transform = `translate(${((tv.x + 1) / 2) * w}px, ${((1 - tv.y) / 2) * h}px)`;
      p.b.classList.toggle('hide', !vis);
      p.b.tabIndex = vis ? 0 : -1;
    }
  }

  function goTo(id, step = 0) {
    if (exploring) { flyTo(id); return; }
    const c = chapters.find((x) => x.id === id);
    if (!c) return;
    const el = c.steps[step] || c.el;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: step ? 'center' : 'start' });
  }

  // ---------------------------------------------------------------- rotation à la souris / au doigt (mode défilement)
  let yaw = 0, pitch = 0, lastInteract = 0, drag = null;
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  function pickZone(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    let best = null, bd = Infinity; const hit = new THREE.Vector3();
    for (const z of zones) {
      if (ray.ray.intersectBox(z.box, hit)) { const d = hit.distanceTo(ray.ray.origin); if (d < bd) { bd = d; best = z; } }
    }
    return best;
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (exploring) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, type: e.pointerType };
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (exploring) return;
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      drag.x = e.clientX; drag.y = e.clientY;
      yaw = clamp(yaw - dx * 0.006, -1.1, 1.1);
      if (drag.type === 'mouse') pitch = clamp(pitch + dy * 0.004, -0.3, 0.45);
      lastInteract = performance.now();
      stage.classList.add('dragging');
    } else if (e.pointerType === 'mouse') {
      const z = pickZone(e);
      hover.visible = !!z; if (z) hover.box.copy(z.box);
      canvas.style.cursor = z ? 'pointer' : 'grab';
    }
  });
  const endDrag = (e) => {
    if (!drag) return;
    const click = drag.moved < 6;
    drag = null; stage.classList.remove('dragging');
    if (click && e.type === 'pointerup') { const z = pickZone(e); if (z) goTo(z.id, z.step || 0); }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { hover.visible = false; });

  // ---------------------------------------------------------------- mode exploration libre
  let exploring = false, fly = null, trip = null;
  const SHAFT_TOP = new THREE.Vector3(-15, 4.2, 7.6), SHAFT_BOTTOM = new THREE.Vector3(-15, -1.8, 7.6);
  function makeTrip(from, fromT, to) {
    const pts = [from.clone()], under = (v) => v.y < 0.3;
    if (under(from)) pts.push(SHAFT_BOTTOM.clone(), SHAFT_TOP.clone());
    const a = pts[pts.length - 1], b = under(to) ? SHAFT_TOP : to, d = a.distanceTo(b);
    if (d > 20) { const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y, 0) + Math.min(40, 6 + d * 0.3); pts.push(m); }
    if (under(to)) pts.push(SHAFT_TOP.clone(), SHAFT_BOTTOM.clone());
    pts.push(to.clone());
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    return { curve, t: 0, t0: fromT.clone(), dur: clamp(0.9 + curve.getLength() / 70, 1.1, 2.6) };
  }
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 5; controls.maxDistance = 140; controls.maxPolarAngle = Math.PI * 0.49;
  controls.screenSpacePanning = false;
  const info = $('#xp-info');
  function setExplore(on) {
    exploring = on;
    if (on && paused) { paused = false; clock.getDelta(); requestAnimationFrame(tick); }
    doc.classList.toggle('xp-exploring', on);
    controls.enabled = on;
    if (on) {
      controls.target.copy(cur.tgt);
      lockScroll(true);
      $('#xp-exit')?.focus();
    } else {
      fly = null; info && (info.hidden = true);
      lockScroll(false);
      yaw = pitch = 0;
      $('#xp-explore')?.focus();
    }
  }
  let savedY = 0;
  function lockScroll(on) {
    if (on) { savedY = scrollY; document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; scrollTo(0, savedY); }
  }
  function flyTo(id) {
    const p = PLACES[id]; if (!p) return;
    fly = { from: camera.position.clone(), fromT: controls.target.clone(), to: new THREE.Vector3(...p.shot.pos), toT: new THREE.Vector3(...p.shot.tgt), t: 0 };
    const src = document.querySelector(`[data-place="${id}"]`);
    if (info && src) {
      info.innerHTML = src.innerHTML;
      info.hidden = false;
      info.querySelector('[data-goto]')?.addEventListener('click', (ev) => { ev.preventDefault(); setExplore(false); requestAnimationFrame(() => goTo(id)); });
    }
  }
  $('#xp-explore')?.addEventListener('click', () => setExplore(true));
  $('#xp-exit')?.addEventListener('click', () => setExplore(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && exploring) setExplore(false); });

  // ---------------------------------------------------------------- récit : animations par chapitre
  // Les étapes sont exprimées en blocs de texte (voir stepPos) : 1 = prise en charge, 2 = sinistre, etc.
  const lc = new THREE.Vector3();
  const carPath = makePath([
    { pts: [[11, 19.5], [11, 15], [11, 10]], from: 0.2, to: 1.0 },
    { pts: [[11, 10], [9, 6.5], [5, 4.5], [2, 3.2], [2, 1.1]], from: 1.15, to: 1.85 },
    { pts: [[2, 1.1], [2, 5.4]], rev: true, from: 3.25, to: 3.45 },
    { pts: [[2, 5.4], [7, 4.6], [12, 3.4], [14, 0.6], [14, -5.6]], from: 3.45, to: 3.85 },
    { pts: [[14, -5.6], [14, 2.5], [13, 6.5], [11.4, 10], [11, 17]], from: 4.45, to: 4.95 },
  ]);
  const primer = new THREE.Color(0x8d8f91), red = new THREE.Color(0xc8101a), metal = new THREE.Color(0x9fa2a3), appret = new THREE.Color(0xbcb6a6);
  let heading = Math.PI / 2;

  function storyUpdate(dt, time) {
    // ---- 01 carrosserie
    const pc = stepPos('carrosserie');
    const pos = carPath(pc);
    W.storyCar.position.set(pos.x, 0, pos.z);
    let dh = pos.heading - heading; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
    heading += INSTANT ? dh : dh * Math.min(1, dt * 8);
    W.storyCar.rotation.y = heading;
    const lift = smooth(range(pc, 1.85, 2.15)) * (1 - smooth(range(pc, 2.95, 3.2)));
    W.storyCar.position.y = lift * 1.6;
    W.liftArms.position.y = 0.2 + lift * 1.6;
    const dmg = range(pc, 1.8, 2.0) * (1 - range(pc, 2.6, 2.95));
    W.damage.material.opacity = dmg * (0.25 + 0.12 * Math.sin(time * 5));
    const mk = smooth(range(pc, 2.3, 2.7));
    W.mechanic.position.set(lerp(4.6, 3.9, mk), 0, lerp(3.4, -0.4, mk));
    const paintP = smooth(range(pc, 3.9, 4.25));
    W.storyMat.color.copy(primer).lerp(red, paintP);
    W.storyMat.clearcoat = 0.3 + paintP * 0.7;
    const booth = range(pc, 3.7, 3.9) * (1 - range(pc, 4.35, 4.5));
    W.boothCeil.emissiveIntensity = 0.15 + booth * 1.6;
    W.lights.booth.intensity = booth * 60;
    mist.rate = pc > 3.9 && pc < 4.3 && !reduce ? 220 : 0;
    W.painter.position.z = -5.5 + Math.sin(time * 1.4) * 1.6 * booth;
    mist.origin.set(-12.1, 1.3, W.painter.position.z); mist.dir.set(-1, 0.05, 0); // bâtiment en miroir
    W.door.position.y = (pc > 0.6 && pc < 5.5 ? 1 : 0) * 3.9;

    // ---- 02 gardiennage : l'ascenseur descend au sous-sol
    const pg = stepPos('gardiennage');
    W.lift.position.y = -4.2 * smooth(range(pg, 1.6, 2.2));
    const base = Math.max(cur.cut, exploring ? 1 : 0, smooth(range(pg, 1.1, 1.7)) * (1 - smooth(range(pg, 3.6, 3.8))));
    W.lights.base1.intensity = W.lights.base2.intensity = base * 55 * bakedK;

    // ---- 03 restauration : la caisse pivote sur la rotissoire
    const pr = stepPos('restauration');
    W.rotisserie.rotation.x = -0.6 * smooth(range(pr, 0.4, 1.0)) + (-Math.PI + 0.6) * smooth(range(pr, 3.3, 3.95));
    setFade(W.masking, smooth(range(pr, 1.6, 2.0)) * (1 - smooth(range(pr, 2.6, 3.0))));
    W.shellMat.color.copy(metal).lerp(appret, smooth(range(pr, 2.6, 3.0)));
    W.lights.resto.intensity = cur.open * 30 * bakedK;
    W.lights.atelier.intensity = cur.open * 70 * bakedK;

    // ---- 05 lavage : mousse, haute pression, rinçage
    const pl = stepPos('lavage');
    const wash = range(pl, 0.55, 2.2);
    const foam = smooth(range(wash, 0.0, 0.3)) * (1 - smooth(range(wash, 0.55, 0.9)));
    W.foamMat.opacity = foam * 0.85;
    const sweep = Math.sin(time * 0.9);
    W.washer.position.set(3.2, 0.04, 3.25 + sweep * 1.5);
    const nozzle = lc.set(2.75, 0.9 + 0.3 * Math.sin(time * 2.3), 3.25 + sweep * 1.5); // repère local de la station
    W.lance.position.copy(nozzle).add(ta.set(0.35, 0.2, 0)); W.lance.rotation.y = Math.PI / 2;
    water.origin.copy(nozzle).add(W.lv.position); water.dir.set(-1, -0.25, sweep * 0.1).normalize();
    water.rate = wash > 0.02 && wash < 0.98 && !reduce ? (mobile ? 400 : 1100) : 0;
    W.washCar.userData.bodyMat.roughness = lerp(0.32, 0.12, smooth(range(pl, 2.0, 2.4)));

    // ---- 06 histoire : l'agrandissement s'élève
    const e = cur.ext;
    W.extension.visible = e > 0.01;
    W.extension.userData.cols.forEach((c, i) => { const k = smooth(clamp(e * 1.6 - i * 0.04)); c.scale.y = Math.max(0.001, k); c.position.y = 4.25 * k; });
    W.extension.userData.beams.forEach((b, i) => { b.visible = e > 0.7 + i * 0.05; });
  }

  function makePath(segs) {
    const curves = segs.map((s) => ({ ...s, c: new THREE.CatmullRomCurve3(s.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal') }));
    const out = { x: 0, z: 0, heading: Math.PI / 2 };
    const tan = new THREE.Vector3(), pt = new THREE.Vector3();
    return (p) => {
      let seg = curves[0], u = 0;
      if (p <= curves[0].from) { seg = curves[0]; u = 0; }
      else {
        for (const s of curves) {
          if (p >= s.from) { seg = s; u = clamp((p - s.from) / (s.to - s.from)); }
        }
      }
      u = smooth(u);
      seg.c.getPointAt(u, pt); seg.c.getTangentAt(Math.min(u, 0.999), tan);
      if (seg.rev) tan.negate();
      out.x = pt.x; out.z = pt.z;
      out.heading = Math.atan2(-tan.z, tan.x);
      return out;
    };
  }

  // ---------------------------------------------------------------- étapes visibles / navigation de chapitre
  const rail = $$('#xp-rail a');
  let activeCh = '';
  function markActive() {
    const mid = scrollY + vh * 0.5;
    let id = chapters[0]?.id;
    for (const c of chapters) if (mid >= c.top) id = c.id;
    if (id !== activeCh) {
      activeCh = id;
      doc.dataset.ch = id;
      rail.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + (chapters.find((c) => c.id === id)?.el.id)));
      const on = rail.find((a) => a.hasAttribute('aria-current')), bar = on && on.parentElement;
      if (on && bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
    for (const c of chapters) for (const s of c.steps) {
      const r = s.getBoundingClientRect();
      s.classList.toggle('on', r.top < vh * 0.62 && r.bottom > vh * 0.38);
    }
  }

  // ---------------------------------------------------------------- boucle
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
    camera.aspect = w / h;
    // Décale le cadrage : le sujet à droite du texte (ordinateur) ou en haut de l'écran (téléphone)
    if (w > 900) camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.14, w, h);
    camera.updateProjectionMatrix();
    layout();
  }
  addEventListener('resize', resize);
  new ResizeObserver(() => layout()).observe(document.body);

  const clock = new THREE.Clock();
  const off = new THREE.Vector3(), sph = new THREE.Spherical();
  let frames = 0, slow = 0, acc = 0;
  let running = true, paused = false;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && !paused) { clock.getDelta(); requestAnimationFrame(tick); } });

  function tick() {
    if (!running) return;
    if (PHOTO && !exploring) { paused = true; return; } // maquette masquée : on ne dessine rien
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    if (!exploring) {
      sample(scrollY + vh * 0.5);
      const k = INSTANT ? 1 : 1 - Math.exp(-dt * (reduce ? 12 : 4.2));
      // grands sauts (navigation directe, défilement rapide) : trajet courbe par le ciel, et par la trémie pour le sous-sol
      if (!INSTANT && !reduce && !trip) {
        const d = cur.pos.distanceTo(want.pos), under = (v) => v.y < 0.3;
        if (d > 28 || (under(cur.pos) !== under(want.pos) && d > 4)) trip = makeTrip(cur.pos, cur.tgt, want.pos);
      }
      if (trip) {
        trip.t = Math.min(1, trip.t + dt / trip.dur);
        const u = smooth(trip.t);
        trip.curve.getPoint(u, cur.pos); cur.tgt.lerpVectors(trip.t0, want.tgt, smooth(range(trip.t, 0.15, 1)));
        if (trip.t >= 1) trip = null;
      } else { cur.pos.lerp(want.pos, k); cur.tgt.lerp(want.tgt, k); }
      for (const key of ['open', 'cut', 'ext', 'dim']) cur[key] = lerp(cur[key], want[key], INSTANT ? 1 : 1 - Math.exp(-dt * 5));
      if (!drag && performance.now() - lastInteract > 3500) { yaw *= 1 - Math.min(1, dt * 1.2); pitch *= 1 - Math.min(1, dt * 1.2); }
      const idle = activeCh === 'hero' && !reduce ? Math.sin(time * 0.12) * 0.12 : 0;
      off.copy(cur.pos).sub(cur.tgt);
      const pull = camera.aspect < 0.8 ? 1.45 : camera.aspect < 1.2 ? 1.2 : 1; // écrans étroits : on recule (progressivement nul au sous-sol)
      off.multiplyScalar(lerp(1, pull, smooth(clamp((cur.pos.y - 0.5) / 3))));
      sph.setFromVector3(off);
      sph.theta += yaw + idle; sph.phi = clamp(sph.phi - pitch, 0.25, 1.62);
      off.setFromSpherical(sph);
      camera.position.copy(cur.tgt).add(off);
      camera.lookAt(cur.tgt);
    } else {
      if (fly) {
        fly.t = Math.min(1, fly.t + dt / 1.4);
        const u = smooth(fly.t);
        camera.position.lerpVectors(fly.from, fly.to, u);
        controls.target.lerpVectors(fly.fromT, fly.toT, u);
        if (fly.t >= 1) fly = null;
      }
      controls.update();
      cur.pos.copy(camera.position); cur.tgt.copy(controls.target);
      cur.open = lerp(cur.open, 1, 1 - Math.exp(-dt * 4));
      cur.cut = lerp(cur.cut, 1, 1 - Math.exp(-dt * 4));
      cur.dim = lerp(cur.dim, 0, 1 - Math.exp(-dt * 4));
      cur.ext = lerp(cur.ext, 1, 1 - Math.exp(-dt * 4));
    }

    // bâtiment qui s'ouvre
    const o = smooth(cur.open);
    W.front.position.y = o * 9; setFade(W.front, 1 - smooth(range(cur.open, 0.15, 0.85)));
    W.roof.position.y = o * 12; setFade(W.roof, 1 - smooth(range(cur.open, 0.05, 0.7)));
    const c = smooth(cur.cut);
    W.plug.position.y = -c * 1.5; setFade(W.plug, 1 - c);
    setFade(W.basementFront, 1 - c);
    stage.style.setProperty('--dim', cur.dim.toFixed(3));

    storyUpdate(dt, time);
    water.update(dt); mist.update(dt);
    placePins(exploring || activeCh === 'hero');

    if (composer) composer.render(); else renderer.render(scene, camera);

    // qualité adaptative : réduit la définition si l'appareil peine
    acc += dt; frames++;
    if (acc > 2) {
      const fps = frames / acc; frames = 0; acc = 0;
      if (fps < 40 && dpr > 0.75) { dpr = Math.max(0.75, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); slow++; }
      else if (fps < 22 && dpr <= 0.75 && !document.hidden) { if (++crawl >= 2) offerLite(); }
      else if (fps > 57 && dpr < dprMax && slow < 3) { dpr = Math.min(dprMax, dpr + 0.25); renderer.setPixelRatio(dpr); resize(); }
    }
    requestAnimationFrame(tick);
  }

  // appareil trop lent ou contexte WebGL perdu : proposer la version sans animation (photos réelles, même contenu)
  let crawl = 0, offered = false;
  function offerLite(lost) {
    if (offered) return; offered = true;
    const t = document.createElement('div'); t.className = 'xp-lite'; t.setAttribute('role', 'status');
    t.innerHTML = `<p>${lost ? 'La maquette 3D s’est interrompue sur cet appareil.' : 'La maquette 3D semble lente sur cet appareil.'}</p><button type="button" class="xbtn xbtn-red">Version sans animation</button><button type="button" class="xbtn xbtn-line" data-close>Continuer</button>`;
    t.querySelector('.xbtn-red').addEventListener('click', () => { try { localStorage.setItem('wfmode', 'off'); } catch (e) {} location.reload(); });
    t.querySelector('[data-close]').addEventListener('click', () => t.remove());
    document.body.appendChild(t);
  }
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); offerLite(true); });

  resize();
  sample(scrollY + vh * 0.5);
  cur.pos.copy(want.pos); cur.tgt.copy(want.tgt);
  ['open', 'cut', 'ext', 'dim'].forEach((k) => (cur[k] = want[k]));
  if (!PHOTO) { addEventListener('scroll', markActive, { passive: true }); markActive(); }
  renderer.compile(scene, camera);
  requestAnimationFrame(() => {
    if (PHOTO) {
      // vue d'ensemble du bâtiment, ouvert, comme point de départ de l'exploration
      cur.pos.set(...SHOTS.hero[1].pos); cur.tgt.set(...SHOTS.hero[1].tgt);
      cur.open = cur.cut = cur.ext = 1; cur.dim = 0;
      camera.position.copy(cur.pos); camera.lookAt(cur.tgt);
      doc.classList.add('xp-ready'); setExplore(true);
    }
    else doc.classList.add('xp-on');
    tick();
    doc.classList.remove('xp-pending');
    window.__xp = { renderer, scene, camera, W, THREE }; // pour le débogage
  });
}
