// Bâtiment de la carrosserie : représentation CONCEPTUELLE. Le volume (boîte en bardage anthracite, bande vitrée,
// marquises « Réception » et « Atelier », enseigne) reprend les photos publiques du bâtiment ; la disposition
// intérieure, les dimensions et le nombre de places sont indicatifs.
import * as THREE from 'three';
import * as T from './textures.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { makeCar, paint, addRearWing, carMaterials } from './car.js';

const RED = 0xc8101a;

export const M = {
  poche: new THREE.MeshStandardMaterial({ color: 0x1c1d1f, roughness: 0.9 }),
  ground: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }),
  paving: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf1f0ec, roughness: 0.85 }),
  red: new THREE.MeshStandardMaterial({ color: RED, roughness: 0.45, metalness: 0.1 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5, metalness: 0.6 }),
  grey: new THREE.MeshStandardMaterial({ color: 0x55585d, roughness: 0.6, metalness: 0.2 }),
  lightGrey: new THREE.MeshStandardMaterial({ color: 0xb9bbbe, roughness: 0.55, metalness: 0.3 }),
  line: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
  led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.4 }),
  figure: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.8 }), // tenue de travail sombre
  figureLegs: new THREE.MeshStandardMaterial({ color: 0xa3121b, roughness: 0.8 }), // pantalon rouge, comme sur les photos de l'atelier
  skin: new THREE.MeshStandardMaterial({ color: 0xc99f86, roughness: 0.7 }),
  wet: new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.18, metalness: 0.2 }),
};

function box(w, h, d, mat, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast ?? true; m.receiveShadow = opts.receive ?? true;
  return m;
}
// Boîte définie par ses limites (xmin..xmax, ymin..ymax, zmin..zmax)
function span(x0, x1, y0, y1, z0, z1, mat, opts) {
  return box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, opts);
}

const PH = {};
function clad(w, h) {
  const t = T.claddingTexture(); t.repeat.set(Math.max(1, w / 2.4), 1);
  const b = T.claddingBump(); b.repeat.set(Math.max(1, w / 2.4), 1);
  const m = new THREE.MeshStandardMaterial({ map: t, bumpMap: b, bumpScale: 0.6, roughness: 0.55, metalness: 0.35, color: 0xffffff });
  if (PH.clad) { m.normalMap = PH.clad(w); m.bumpMap = null; m.normalScale.set(0.7, 0.7); m.roughness = 0.62; }
  return m;
}

const glassMat = () => new THREE.MeshPhysicalMaterial({ color: 0x2b3a44, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.38, envMapIntensity: 1.5, depthWrite: false });

// Personnage de maquette (silhouette neutre, pas un portrait).
export function figure(h = 1.78) {
  const g = new THREE.Group();
  // jambes, buste, bras, tête : silhouette sobre, sans visage
  for (const sx of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, h * 0.4, 4, 10), M.figureLegs);
    leg.position.set(sx, h * 0.25, 0); leg.castShadow = true; g.add(leg);
  }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, h * 0.22, 6, 12), M.figure);
  body.position.y = h * 0.64; body.scale.z = 0.7; body.castShadow = true;
  for (const sx of [-0.23, 0.23]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, h * 0.26, 4, 8), M.figure);
    arm.position.set(sx, h * 0.6, 0); arm.rotation.z = sx * 0.25; arm.castShadow = true; g.add(arm);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), M.skin);
  head.position.y = h * 0.9; head.castShadow = true;
  g.add(body, head);
  return g;
}

function textPlane(lines, w, h, opts) {
  const t = T.textTexture(lines, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.userData.text = true;
  return m;
}

// Prépare un groupe pour les fondus (matériaux propres au groupe).
export function fadable(group) {
  const mats = new Map();
  group.traverse((o) => {
    if (!o.isMesh) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const cl = list.map((m) => { if (!mats.has(m)) { const c = m.clone(); c.userData.baseOpacity = m.opacity; c.userData.baseTransparent = m.transparent; c.transparent = true; mats.set(m, c); } return mats.get(m); });
    o.material = Array.isArray(o.material) ? cl : cl[0];
    o.userData.cast = o.castShadow;
  });
  group.userData.fade = 1;
  group.userData.mats = [...mats.values()];
  return group;
}
export function setFade(group, f) {
  if (Math.abs(group.userData.fade - f) < 0.001) return;
  group.userData.fade = f;
  group.visible = f > 0.01;
  // Les matériaux restent « transparent » en permanence : changer ce drapeau forcerait une recompilation des shaders.
  for (const m of group.userData.mats) {
    m.opacity = m.userData.baseOpacity * f;
    m.depthWrite = !m.userData.baseTransparent && f > 0.98;
  }
  group.traverse((o) => { if (o.isMesh) o.castShadow = o.userData.cast && f > 0.6; });
}

export function buildWorld({ logoUrl, mobile, carUrl = 'assets/models/covered_car/covered_car.gltf' }) {
  // sols réalistes : gazon autour, enrobé sur la cour et les accès
  // textures photographiques Poly Haven (CC0), chargées en tâche de fond ; repli sur les textures générées
  const tl = new THREE.TextureLoader();
  const ph = (name, rep, srgb = true) => {
    const t = tl.load(`assets/tex/${name}.webp`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  M.ground.map = ph('leafy_grass_diff', [70, 70]); M.ground.normalMap = ph('leafy_grass_nor', [70, 70], false);
  M.ground.color.set(0xffffff); M.ground.normalScale.set(0.6, 0.6);
  M.paving.map = ph('clean_asphalt_diff', [20, 14]); M.paving.normalMap = ph('clean_asphalt_nor', [20, 14], false);
  M.paving.color.set(0xffffff); M.paving.roughness = 0.88;
  const cladNor = (w) => ph('box_profile_metal_sheet_nor', [Math.max(1, w / 1.6), 1], false);
  const shutter = (w, h) => new THREE.MeshStandardMaterial({ map: ph('painted_metal_shutter_diff', [Math.max(1, w / 3), Math.max(1, h / 3)]), normalMap: ph('painted_metal_shutter_nor', [Math.max(1, w / 3), Math.max(1, h / 3)], false), roughness: 0.55, metalness: 0.4 });
  PH.clad = cladNor; PH.shutter = shutter;
  // Le bâtiment est construit dans « root », retourné en miroir (scale.x = -1) pour respecter l'orientation réelle :
  // réception à l'extrémité est (droite) de la façade, porte d'atelier à l'ouest. Les textes sont remis à l'endroit.
  // Les abords (cour, voisins, lavage, voiture n° 438) sont dans « site », en coordonnées réelles, sans miroir.
  const world = new THREE.Group();
  const root = new THREE.Group(); root.scale.x = -1; world.add(root);
  const site = new THREE.Group(); world.add(site);
  const W = {}; // éléments animés
  const anchors = {};
  const zones = [];

  // ------------------------------------------------------------ sol, coupe du terrain
  const earthMats = (top) => [M.poche, M.poche, top, M.poche, M.poche, M.poche];
  const earth = (x0, x1, z0, z1, top = M.ground) => {
    const m = span(x0, x1, -5, 0, z0, z1, earthMats(top), { cast: false });
    root.add(m); return m;
  };
  earth(-90, 90, -90, -11);
  earth(-90, -20, -11, 15);
  earth(20, 90, -11, 15);
  earth(-90, 90, 15, 90);
  root.add(span(-20, 20, -6, -4.6, 11, 15, M.poche, { cast: false }));
  // Bouchon de terrain devant le sous-sol : il s'efface pour montrer la coupe
  W.plug = fadable(new THREE.Group());
  W.plug.add(span(-20, 20, -4.6, 0, 11, 15, earthMats(M.paving), { cast: false }));
  root.add(W.plug);

  // Cour : enrobé jusqu'à la route, places en épi devant le bâtiment (d'après la vue aérienne)
  const court = span(-34, 40, 0, 0.02, 15, 70, M.paving, { cast: false }); site.add(court);
  site.add(span(-20.5, 20.5, 0, 0.02, 13.2, 15, M.paving, { cast: false }));
  for (let i = 0; i < 10; i++) site.add(span(-22 + i * 2.6, -21.9 + i * 2.6, 0.02, 0.03, 15.3, 19.6, M.line, { cast: false }));
  site.add(span(-22, 1.5, 0.02, 0.03, 19.5, 19.6, M.line, { cast: false }));
  // Voisinage (bâtiments d'autres entreprises, volumes neutres, sans enseigne)
  const neigh = new THREE.MeshStandardMaterial({ color: 0xb9bab6, roughness: 0.85 });
  const neighRoof = new THREE.MeshStandardMaterial({ color: 0x8e8f8c, roughness: 0.9 });
  site.add(span(-27, -9.4, 0, 7.2, 18.7, 56.6, [neigh, neigh, neighRoof, neigh, neigh, neigh]));
  site.add(span(1.2, 29, 0.02, 0.06, 19, 62, M.ground, { cast: false })); // îlot de gazon
  site.add(span(5.9, 18.3, 0, 6, 25.4, 41.3, [neigh, neigh, neighRoof, neigh, neigh, neigh]));
  neigh.map = T.panelTexture(); neigh.map.repeat.set(6, 2.2);
  // détails génériques des voisins : bandeaux vitrés, portes sectionnelles, acrotères (sans enseigne)
  const dGlass = new THREE.MeshStandardMaterial({ color: 0x2c3640, roughness: 0.15, metalness: 0.6 });
  const dDoor = PH.shutter(4, 3.8);
  const dEdge = new THREE.MeshStandardMaterial({ color: 0x6d6f6d, roughness: 0.7, metalness: 0.3 });
  const parapet = (x0, x1, z0, z1, h) => { site.add(span(x0 - 0.05, x1 + 0.05, h, h + 0.35, z0 - 0.05, z0 + 0.15, dEdge), span(x0 - 0.05, x1 + 0.05, h, h + 0.35, z1 - 0.15, z1 + 0.05, dEdge), span(x0 - 0.05, x0 + 0.15, h, h + 0.35, z0, z1, dEdge), span(x1 - 0.15, x1 + 0.05, h, h + 0.35, z0, z1, dEdge)); };
  parapet(-27, -9.4, 18.7, 56.6, 7.2); parapet(5.9, 18.3, 25.4, 41.3, 6);
  // voisin ouest : face est (côté cour)
  site.add(span(-9.4, -9.32, 4.3, 5.6, 20, 47.5, dGlass, { cast: false }));
  for (const z of [32, 37.5]) site.add(span(-9.4, -9.3, 0, 3.8, z, z + 4, dDoor, { cast: false }));
  site.add(span(-9.4, -9.32, 0.4, 2.6, 43, 47.5, dGlass, { cast: false }));
  site.add(span(-9.4, -9.3, 0, 2.2, 41.8, 42.8, dDoor, { cast: false }));
  // voisin du milieu : faces ouest et sud
  site.add(span(5.82, 5.9, 3.4, 4.8, 26.5, 40.2, dGlass, { cast: false }));
  site.add(span(7, 17.2, 3.4, 4.8, 41.3, 41.38, dGlass, { cast: false }));
  site.add(span(8.5, 12.5, 0, 3.6, 41.3, 41.4, dDoor, { cast: false }));
  site.add(span(14, 15, 0, 2.2, 41.3, 41.4, dDoor, { cast: false }));
  // bordures béton autour de l'îlot de gazon
  const kerb = new THREE.MeshStandardMaterial({ color: 0xbdbcb6, roughness: 0.9 });
  site.add(span(1.05, 1.3, 0, 0.14, 19, 62, kerb, { cast: false }), span(1.05, 29, 0, 0.14, 18.85, 19.1, kerb, { cast: false }));
  // arbres (feuillus, formes simples) et lampadaires de cour
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x5a4a3c, roughness: 0.95 });
  const leafMs = [0x55663f, 0x4c5e3a, 0x637247].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }));
  const trunkG = new THREE.CylinderGeometry(0.14, 0.2, 2.6, 7);
  const tree = (x, z, k = 1, i = 0) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(k); t.rotation.y = i;
    const tr = new THREE.Mesh(trunkG, trunkM); tr.position.y = 1.3; tr.castShadow = true; t.add(tr);
    for (let j = 0; j < 3; j++) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 - j * 0.25, 1), leafMs[(i + j) % 3]);
      c.position.set(Math.sin(j * 2.1) * 0.6, 3.3 + j * 0.8, Math.cos(j * 2.1) * 0.6); c.castShadow = true; t.add(c);
    }
    site.add(t);
  };
  [[22, 23, 1.1], [26, 30, 0.9], [24, 46, 1.2], [21, 55, 1], [3.5, 50, 0.9], [27, 59, 1.05], [-31, 25, 1.1], [-31, 38, 0.95], [-31, 50, 1.15], [34, -6, 1.2], [36, 6, 1], [-34, -8, 1.1], [-30, -16, 1]].forEach(([x, z, k], i) => tree(x, z, k, i));
  const pole = new THREE.MeshStandardMaterial({ color: 0x3a3c3f, roughness: 0.5, metalness: 0.6 });
  const lampHead = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, emissive: 0xfff3dc, emissiveIntensity: 0.4 });
  for (const [x, z] of [[-21, 17.6], [24, 17.2], [0.8, 44], [0.8, 60]]) {
    site.add(span(x - 0.07, x + 0.07, 0, 6, z - 0.07, z + 0.07, pole), span(x - 0.07, x + 0.07, 5.9, 6, z - 0.07, z + 0.9, pole), span(x - 0.12, x + 0.12, 5.85, 5.92, z + 0.5, z + 0.95, lampHead, { cast: false }));
  }

  // ------------------------------------------------------------ sous-sol (gardiennage)
  const bs = new THREE.Group(); root.add(bs);
  const conc = new THREE.MeshStandardMaterial({ map: T.concreteTexture(), roughness: 0.85 }); conc.map.repeat.set(8, 5);
  bs.add(span(-20, 20, -4.6, -4.2, -11, 11, earthMats(conc), { cast: false }));
  bs.add(span(-20.3, 20.3, -4.2, -0.35, -11.3, -11, M.white));
  bs.add(span(-20.3, -20, -4.2, -0.35, -11, 11, M.white));
  bs.add(span(20, 20.3, -4.2, -0.35, -11, 11, M.white));
  W.basementFront = fadable(new THREE.Group());
  W.basementFront.add(span(-20.3, 20.3, -4.2, -0.35, 11, 11.3, [M.poche, M.poche, M.poche, M.poche, M.poche, M.white]));
  root.add(W.basementFront);
  // piliers rouges, places marquées, voitures sous housse (comme sur la photo du sous-sol)
  for (const x of [-14, -6.5, 1, 8.5]) for (const z of [-4.4, 4.4]) bs.add(box(0.45, 3.85, 0.45, M.red, x, -2.3, z));
  const coverSlots = [];
  const coverCar = makeCar({ type: 'coupe', mode: 'cover' });
  const coverSedan = makeCar({ type: 'sedan', mode: 'cover' });
  const bayX = [-18.2, -15.6, -12.4, -9.8, -7.2, -4.0, -1.4, 2.0, 4.6, 7.2, 10.4, 13.0];
  bayX.forEach((x, i) => {
    const c = (i % 3 === 1 ? coverSedan : coverCar).clone();
    c.rotation.y = Math.PI / 2; c.position.set(x, -4.2, -8.3); bs.add(c); coverSlots.push(c);
    bs.add(span(x - 1.32, x - 1.28, -4.19, -4.18, -11, -5.6, M.line, { cast: false }));
    const n = textPlane(String(i + 1), 0.6, 0.6, { w: 128, h: 128, font: '600 90px Inter, Arial', color: '#ffffff' });
    n.rotation.x = -Math.PI / 2; n.position.set(x, -4.17, -5.2); bs.add(n);
  });
  [-16.5, -12.8, -9.1, -2.6, 1.1, 4.8].forEach((x, i) => {
    const c = (i % 2 ? coverSedan : coverCar).clone();
    c.rotation.y = -Math.PI / 2; c.position.set(x, -4.2, 7.6); bs.add(c); coverSlots.push(c);
  });
  // voiture sous housse photoréaliste (« Covered Car », Poly Haven, CC0) : remplace les volumes simples une fois chargée
  new GLTFLoader().load(carUrl, (g) => {
    const model = g.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      if (/cover/.test(o.name)) { o.material = o.material.clone(); o.material.map = null; o.material.color.set(0x9c1218); o.material.roughness = 0.85; }
    });
    const bb = new THREE.Box3().setFromObject(model), size = bb.getSize(new THREE.Vector3());
    const wrap = new THREE.Group(); wrap.add(model);
    if (size.z > size.x) model.rotation.y = Math.PI / 2;
    const k = 4.5 / Math.max(size.x, size.z); model.scale.setScalar(k);
    const b2 = new THREE.Box3().setFromObject(wrap), c2 = b2.getCenter(new THREE.Vector3());
    model.position.set(-c2.x, -b2.min.y, -c2.z);
    coverSlots.forEach((slot, i) => {
      const m = wrap.clone(); m.position.copy(slot.position); m.rotation.copy(slot.rotation);
      m.rotation.y += (i % 2 ? Math.PI : 0); slot.parent.add(m); slot.visible = false;
    });
  });
  bs.add(span(-20, 14, -4.19, -4.18, -5.62, -5.58, M.line, { cast: false }));
  // éclairage du sous-sol
  for (const x of [-16, -10, -3, 4, 11]) for (const z of [-7, 0, 7]) bs.add(box(1.6, 0.05, 0.16, M.led, x, -0.42, z, { cast: false }));
  anchors.gardiennage = new THREE.Vector3(-3, -2.2, 0);

  // ------------------------------------------------------------ dalle du rez (trémie de l'ascenseur à véhicules)
  const epoxy = new THREE.MeshStandardMaterial({ map: T.epoxyTexture(), roughness: 0.35, metalness: 0.05 }); epoxy.map.repeat.set(10, 6);
  const ceil = new THREE.MeshStandardMaterial({ map: T.woodwoolTexture(), roughness: 1 }); ceil.map.repeat.set(16, 9);
  const slabMats = [M.poche, M.poche, epoxy, ceil, M.poche, M.poche];
  root.add(span(-20, 14.5, -0.35, 0, -11, 11, slabMats, { cast: false }));
  root.add(span(14.5, 20, -0.35, 0, -11, 2.8, slabMats, { cast: false }));
  root.add(span(14.5, 20, -0.35, 0, 10.2, 11, slabMats, { cast: false }));
  // ascenseur à véhicules
  W.lift = new THREE.Group();
  const plat = box(5.3, 0.2, 7.2, M.grey, 0, -0.1, 0); W.lift.add(plat);
  W.lift.add(box(5.3, 0.04, 0.12, M.red, 0, 0.02, 3.55), box(5.3, 0.04, 0.12, M.red, 0, 0.02, -3.55));
  W.liftCar = makeCar({ type: 'coupe', color: 0x1f2a36 });
  W.liftCar.rotation.y = -Math.PI / 2; W.lift.add(W.liftCar);
  W.lift.position.set(17.25, 0, 6.5); root.add(W.lift);
  for (const [x, z] of [[14.6, 2.9], [19.9, 2.9], [14.6, 10.1], [19.9, 10.1]]) root.add(box(0.22, 7.6, 0.22, M.red, x, -0.6, z));

  // ------------------------------------------------------------ enveloppe du rez
  const H = 8.5;
  const shell = new THREE.Group(); root.add(shell);
  shell.add(span(-20.3, 20.3, 0, H, -11.3, -11, clad(40.6, H)));
  shell.add(span(-20.3, -20, 0, H, -11, 11, clad(22, H)));
  shell.add(span(20, 20.3, 0, H, -11, 11, clad(22, H)));
  // façade avant : se soulève pour ouvrir le bâtiment
  W.front = fadable(new THREE.Group());
  const F = W.front; const fz = 11.15;
  F.add(span(-20.3, 8, 3.4, H, 11, 11.3, clad(28, 5)));
  F.add(span(8, 14, 4.6, H, 11, 11.3, clad(6, 4)));
  F.add(span(14, 20.3, 3.4, H, 11, 11.3, clad(6, 5)));
  F.add(span(14, 20.3, 0, 3.4, 11, 11.3, clad(6, 3.4)));
  F.add(span(6, 8, 0, 3.4, 11, 11.3, clad(2, 3.4)));
  const g = glassMat();
  F.add(span(-20.3, 6, 0.25, 3.4, 11.08, 11.18, g, { cast: false }));
  for (let x = -20.2; x <= 6.01; x += 2.9) F.add(span(x - 0.05, x + 0.05, 0, 3.4, 11.0, 11.25, M.steel));
  F.add(span(-20.3, 6, 3.32, 3.42, 11.0, 11.26, M.steel));
  // porte sectionnelle de l'atelier
  W.door = new THREE.Group();
  W.door.add(span(8.05, 13.95, 0, 4.55, 11.05, 11.15, PH.shutter(5.9, 4.6)));
  F.add(W.door);
  // marquises
  F.add(span(-20.6, -12.5, 3.55, 3.85, 11.3, 13.6, M.steel));
  F.add(span(7.3, 14.7, 4.85, 5.15, 11.3, 13.9, M.steel));
  const tie = (x) => { const r = box(0.06, 0.06, 3.6, M.steel, x, 6.2, 12.6); r.rotation.x = -0.62; F.add(r); };
  tie(7.8); tie(14.2);
  // enseigne et lettrages
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 8.2 * 516 / 960), new THREE.MeshStandardMaterial({ map: T.loadLogo(logoUrl), transparent: true, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.0 }));
  logo.position.set(-4.5, 6.05, fz + 0.17); logo.userData.text = true; F.add(logo);
  const recep = textPlane('RÉCEPTION', 3.2, 0.5, { w: 1024, h: 160, font: '600 96px Inter, Arial', color: '#ffffff' });
  recep.position.set(-16.5, 3.08, fz + 0.18); F.add(recep);
  const atel = textPlane('ATELIER', 2.6, 0.5, { w: 1024, h: 160, font: '600 104px Inter, Arial', color: '#ffffff' });
  atel.position.set(11, 5.6, fz + 0.18); F.add(atel);
  // panneau de l'association « carrosserie suisse », comme sur la façade
  const cs = textPlane([{ text: 'carrosserie suisse', font: '600 92px Inter, Arial', color: '#2b2b2b' }], 3.6, 0.95, { w: 1024, h: 270, bg: '#f4f4f2' });
  cs.position.set(-11, 6.6, fz + 0.2); F.add(cs);
  root.add(F);
  // toit (s'efface aussi)
  W.roof = fadable(new THREE.Group());
  W.roof.add(span(-20.5, 20.5, H, H + 0.35, -11.5, 11.5, M.steel));
  W.roof.add(span(-20.5, 20.5, H + 0.35, H + 0.75, 11.2, 11.5, clad(41, 0.4)));
  root.add(W.roof);
  // rampes LED intérieures

  // ------------------------------------------------------------ réception (d'après la photo : comptoir gris arrondi, plateau rouge, capot rouge au mur)
  const rc = new THREE.Group(); root.add(rc);
  rc.add(span(-20, -10, 0, 3.3, 2.85, 3.0, M.white));
  rc.add(span(-10.05, -9.95, 0, 3.3, 3.0, 11, g.clone(), { cast: false }));
  const desk = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.05, 32, 1, true, -0.2, 1.9), M.grey); desk.material.side = THREE.DoubleSide;
  desk.position.set(-15, 0.52, 7.4); desk.castShadow = true; rc.add(desk);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.06, 32, 1, false, -0.2, 1.9), M.red); top.position.set(-15, 1.08, 7.4); rc.add(top);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, 0.7), paint(RED, { metal: 0.2 }));
  hood.scale.set(1.5, 0.35, 1.0); hood.rotation.x = Math.PI / 2; hood.position.set(-17.5, 2.0, 3.05); rc.add(hood);
  for (const x of [-12.5, -11.6]) { const ch = box(0.45, 0.45, 0.45, M.red, x, 0.45, 9.4); rc.add(ch); }
  anchors.reception = new THREE.Vector3(-15, 1.8, 7);
  zones.push({ id: 'contact', box: new THREE.Box3(new THREE.Vector3(-20, 0, 3), new THREE.Vector3(-10, 3.3, 11)) });

  // ------------------------------------------------------------ atelier carrosserie
  const at = new THREE.Group(); root.add(at);
  for (const x of [-10, 8]) for (const z of [-3.7, 3.7]) at.add(box(0.32, H, 0.32, M.red, x, H / 2, z));
  const twoPost = (x, z, rot = 0) => {
    const l = new THREE.Group();
    l.add(box(0.35, 3.6, 0.45, M.red, 0, 1.8, 1.45), box(0.35, 3.6, 0.45, M.red, 0, 1.8, -1.45));
    l.add(box(0.3, 0.12, 3.2, M.grey, 0, 0.12, 0, { cast: false }));
    l.position.set(x, 0, z); l.rotation.y = rot; return l;
  };
  // pont de l'histoire (au centre)
  at.add(twoPost(2, 1.1, Math.PI / 2));
  W.liftArms = new THREE.Group();
  W.liftArms.add(box(2.6, 0.1, 0.18, M.steel, 0, 0, 1.1), box(2.6, 0.1, 0.18, M.steel, 0, 0, -1.4));
  W.liftArms.position.set(2, 0.2, 1.1); at.add(W.liftArms);
  // autres postes de travail
  at.add(twoPost(-5.5, -7, Math.PI / 2));
  const tesla = makeCar({ type: 'sedan', color: 0xf2f2f0 }); tesla.rotation.y = -Math.PI / 2; tesla.position.set(-5.5, 1.3, -7); at.add(tesla);
  const coupe = makeCar({ type: 'coupe', color: 0x8e9196 }); coupe.rotation.y = Math.PI / 2 + 0.2; coupe.position.set(-5.5, 0, 6.5); at.add(coupe);
  at.add(span(-9.5, 7.5, 0, 0.95, -10.95, -10.2, M.grey), span(-9.5, 7.5, 0.95, 1.0, -10.95, -10.1, M.lightGrey));
  for (const x of [-8, -2.5, 5]) at.add(box(0.9, 1.0, 0.5, M.red, x, 0.5, -9.4));
  const f1 = figure(); f1.position.set(-4.2, 0, -5.4); at.add(f1);
  const f2 = figure(); f2.position.set(-3.8, 0, 5.2); at.add(f2);
  W.mechanic = figure(); W.mechanic.position.set(4.6, 0, 3.4); at.add(W.mechanic);
  anchors.carrosserie = new THREE.Vector3(0, 3, 0);
  zones.push({ id: 'carrosserie', box: new THREE.Box3(new THREE.Vector3(-10, 0, -11), new THREE.Vector3(8, H, 11)) });

  // ------------------------------------------------------------ cabine de peinture
  const bo = new THREE.Group(); root.add(bo);
  const bx0 = 8.6, bx1 = 19.6, bz0 = -10.8, bz1 = -0.6, bh = 4.4;
  const panel = new THREE.MeshStandardMaterial({ color: 0xdedfdd, roughness: 0.5, metalness: 0.2 });
  const grate = T.grateTexture(); grate.repeat.set(6, 5);
  bo.add(span(bx0, bx1, 0.01, 0.06, bz0, bz1, new THREE.MeshStandardMaterial({ color: 0x9a9da0, map: grate, roughness: 0.55, metalness: 0.7 }), { cast: false }));
  // caillebotis + rampes lumineuses verticales sur les parois (photos de la cabine, août 2026)
  const tube = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9 });
  for (const x of [bx0 + 2.2, bx0 + 5.5, bx0 + 8.8]) bo.add(span(x - 0.2, x + 0.2, 1.0, 3.6, bz0 + 0.13, bz0 + 0.17, tube, { cast: false }));
  for (const z of [bz0 + 2.5, bz0 + 6.5]) for (const x of [bx0 + 0.13, bx1 - 0.17]) bo.add(span(x, x + 0.04, 1.0, 3.6, z - 0.2, z + 0.2, tube, { cast: false }));
  bo.add(span(bx0, bx0 + 0.12, 0, bh, bz0, bz1, panel), span(bx1 - 0.12, bx1, 0, bh, bz0, bz1, panel), span(bx0, bx1, 0, bh, bz0, bz0 + 0.12, panel));
  W.boothCeil = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, emissive: 0xffffff, emissiveIntensity: 0.15, transparent: true, opacity: 0.55, depthWrite: false });
  bo.add(span(bx0, bx1, bh, bh + 0.25, bz0, bz1, W.boothCeil, { cast: false }));
  bo.add(span(bx0, bx1, 0, bh, bz1 - 0.06, bz1, glassMat(), { cast: false }));
  for (const x of [bx0 + 0.1, (bx0 + bx1) / 2, bx1 - 0.1]) bo.add(span(x - 0.06, x + 0.06, 0, bh, bz1 - 0.1, bz1 + 0.02, M.steel));
  bo.add(span(bx0 - 0.2, bx1 + 0.2, bh + 0.25, bh + 1.4, bz0 + 1, bz0 + 3.5, panel));
  W.painter = figure(); W.painter.position.set(11.6, 0.06, -5.5); bo.add(W.painter);
  W.gun = new THREE.Vector3(12.2, 1.35, -5.5);
  anchors.cabine = new THREE.Vector3(14, 2.6, -5.5);
  zones.push({ id: 'carrosserie', step: 3, box: new THREE.Box3(new THREE.Vector3(bx0, 0, bz0), new THREE.Vector3(bx1, bh, bz1)) });

  // ------------------------------------------------------------ restauration : caisse sur rotissoire
  const rs = new THREE.Group(); root.add(rs);
  // rotissoire à deux grands anneaux perforés sur chariot à roulettes (photos Instagram, août 2026)
  const RR = 1.55, ringMat = new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.45, metalness: 0.75, side: THREE.DoubleSide });
  const ringShape = new THREE.Shape(); ringShape.absarc(0, 0, RR, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, RR - 0.13, 0, Math.PI * 2, true); ringShape.holes.push(hole);
  for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, h = new THREE.Path(); h.absarc(Math.cos(a) * (RR - 0.065), Math.sin(a) * (RR - 0.065), 0.025, 0, Math.PI * 2, true); ringShape.holes.push(h); }
  const ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: 0.025, bevelEnabled: false, curveSegments: 48 });
  const cart = new THREE.Group(); cart.position.set(-15, 0, -4.5); rs.add(cart);
  cart.add(box(5.6, 0.1, 0.14, M.steel, 0, 0.22, 0.75), box(5.6, 0.1, 0.14, M.steel, 0, 0.22, -0.75));
  for (const x of [-2.6, 2.6]) {
    cart.add(box(0.14, 0.1, 1.9, M.steel, x, 0.22, 0));
    for (const z of [-0.85, 0.85]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: 0.5 }));
      w.rotation.x = Math.PI / 2; w.position.set(x, 0.1, z); cart.add(w);
      cart.add(box(0.1, 0.12, 0.1, M.steel, x, 0.06 + 0.2, z));
    }
    for (const z of [-0.45, 0.45]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), M.steel); r.rotation.z = Math.PI / 2; r.position.set(x, 0.33, z); cart.add(r); }
  }
  W.rotisserie = new THREE.Group(); W.rotisserie.position.set(-15, 0.33 + RR, -4.5); rs.add(W.rotisserie);
  for (const x of [-2.6, 2.6]) {
    const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.y = Math.PI / 2; ring.position.x = x - 0.012; ring.castShadow = true; W.rotisserie.add(ring);
    for (const a of [0.6, 2.55, 4.5]) { const sp = box(0.06, RR - 0.15, 0.06, M.steel, x, 0, 0); sp.geometry.translate(0, (RR - 0.15) / 2, 0); sp.position.set(x, 0, 0); sp.rotation.x = a; W.rotisserie.add(sp); }
  }
  W.shellMat = paint(0xd9d8d2, { metal: 0.02, rough: 0.7, clear: 0.1 });
  W.shell = makeCar({ type: 'coupe', mode: 'shell', material: W.shellMat });
  W.shell.position.set(0, -0.7, 0); W.rotisserie.add(W.shell);
  W.rotisserie.add(box(5.4, 0.1, 0.1, M.steel, 0, 0, 0));
  // papier de masquage (étape 2)
  W.masking = fadable(new THREE.Group());
  const paper = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.95 });
  W.masking.add(box(1.1, 0.5, 1.9, paper, 1.5, 0.15, 0), box(0.9, 0.42, 1.9, paper, -1.8, 0.2, 0));
  W.rotisserie.add(W.masking);
  const f3 = figure(); f3.position.set(-15, 0, -1.6); rs.add(f3);
  anchors.restauration = new THREE.Vector3(-15, 2, -4.5);
  zones.push({ id: 'restauration', box: new THREE.Box3(new THREE.Vector3(-20, 0, -11), new THREE.Vector3(-10, 4, 2.8)) });

  // ------------------------------------------------------------ voiture de l'histoire « carrosserie »
  W.storyMat = paint(0x8d8f91, { metal: 0.3 });
  W.storyCar = makeCar({ type: 'sedan', material: W.storyMat });
  root.add(W.storyCar);
  W.damage = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 2.1), new THREE.MeshBasicMaterial({ color: 0xff2030, transparent: true, opacity: 0, depthWrite: false }));
  W.damage.position.set(1.95, 0.6, 0); W.storyCar.add(W.damage);

  // ------------------------------------------------------------ cour : voiture de course n° 438 (représentation)
  const race = new THREE.Group(); site.add(race);
  const raceMat = paint(0x34373c, { metal: 0.45, rough: 0.3 });
  W.race = makeCar({ type: 'coupe', material: raceMat, wide: 1.05 });
  addRearWing(W.race, raceMat);
  const W2 = W.race.userData.width / 2 + 0.008;
  for (const side of [1, -1]) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 0.56), new THREE.MeshStandardMaterial({ map: T.liveryTexture(side > 0 ? false : true), transparent: true, roughness: 0.35, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2 }));
    d.position.set(0.05, 0.62, side * W2);
    if (side < 0) d.rotation.y = Math.PI;
    W.race.add(d);
  }
  const lip = box(0.35, 0.06, 1.8, M.red, 2.18, 0.3, 0); W.race.add(lip);
  W.race.position.set(4.2, 0, 16.6); W.race.rotation.y = -0.35;
  race.add(W.race);
  anchors.competition = new THREE.Vector3(4.2, 1, 16.6);
  zones.push({ id: 'competition', box: new THREE.Box3(new THREE.Vector3(1.5, 0, 14.5), new THREE.Vector3(7, 1.6, 18.8)) });
  // voitures de clients devant la réception (comme sur les photos du bâtiment)
  const p1 = makeCar({ type: 'coupe', color: RED }); p1.rotation.y = -Math.PI / 2; p1.position.set(14.2, 0, 17.4); site.add(p1);
  const p2 = makeCar({ type: 'sedan', color: 0xeeeeec }); p2.rotation.y = -Math.PI / 2; p2.position.set(16.8, 0, 17.4); site.add(p2);

  // ------------------------------------------------------------ stations de lavage
  // Emplacements d'après la vue aérienne transmise par l'atelier (novembre 2026) :
  // lavage manuel haute pression devant le bâtiment voisin ; lavage automatique au bout de ce bâtiment.
  // Aspect d'après la publication du 22.08.2026 ; nombre de pistes indicatif.
  const lv = new THREE.Group(); lv.position.set(-9.2, 0, 22.4); site.add(lv); W.lv = lv;
  lv.add(span(0, 7.6, 0, 0.04, 0, 6.5, M.wet, { cast: false }));
  for (const x of [0.15, 3.8, 7.45]) for (const z of [0.15, 6.35]) lv.add(box(0.3, 4.1, 0.3, M.red, x, 2.05, z));
  lv.add(span(0, 7.6, 4.1, 4.4, 0, 6.5, M.steel));
  lv.add(span(-0.05, 7.65, 4.1, 4.8, -0.12, 0.1, M.red));
  lv.add(span(-0.05, 7.65, 4.1, 4.8, 6.4, 6.62, M.red));
  // cloison de piste avec la silhouette de voiture (comme sur la photo)
  const sep = new THREE.MeshStandardMaterial({ color: 0xc9c9c6, roughness: 0.7 });
  lv.add(span(3.65, 3.95, 0.3, 2.8, 0.7, 5.8, sep));
  const lavSign = textPlane([{ text: 'LAVAGE HAUTE PRESSION', font: '700 64px Inter, Arial' }], 5.2, 0.38, { w: 1024, h: 72, color: '#ffffff' });
  lavSign.rotation.y = Math.PI; lavSign.position.set(3.8, 4.45, -0.14); lv.add(lavSign);
  // bornes de paiement (carte et Twint, d'après la publication)
  for (const x of [0.6, 7.0]) { lv.add(box(0.35, 1.3, 0.3, M.steel, x, 0.65, 0.55)); lv.add(box(0.28, 0.2, 0.02, M.led, x, 1.12, 0.39, { cast: false })); }
  W.washCar = makeCar({ type: 'sedan', color: 0x2f4d6b });
  W.washCar.rotation.y = Math.PI / 2; W.washCar.position.set(1.65, 0.04, 3.25); lv.add(W.washCar);
  W.foamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0, depthWrite: false });
  W.foam = new THREE.Group();
  const fb = new THREE.Mesh(W.washCar.userData.body.geometry, W.foamMat); fb.scale.setScalar(1.012);
  const fc = new THREE.Mesh(W.washCar.userData.cabin.geometry, W.foamMat); fc.scale.setScalar(1.012);
  W.foam.add(fb, fc); W.washCar.add(W.foam);
  W.washer = figure(); W.washer.position.set(3.2, 0.04, 3.25); lv.add(W.washer);
  W.lance = box(0.04, 0.04, 1.1, M.steel, 0, 1.2, 0); lv.add(W.lance);
  // lavage automatique : local fermé à bardage sombre, au bout du bâtiment voisin
  const la = new THREE.Group(); site.add(la);
  la.add(span(-27.05, -9.3, 0, 5.6, 49.2, 56.7, clad(17.75, 5.6)));
  // traversant : entrée sur la face est (côté cour), sortie tout droit sur la face ouest (indications de l'atelier, nov. 2026)
  const doorMat = PH.shutter(4.6, 3.6); doorMat.color.set(0x55585c);
  la.add(span(-9.27, -9.2, 0, 3.6, 50.6, 55.2, doorMat, { cast: false }));
  la.add(span(-9.27, -9.12, 3.6, 3.75, 50.5, 55.3, M.red));
  la.add(span(-27.12, -27.05, 0, 3.6, 50.6, 55.2, doorMat, { cast: false }));
  la.add(span(-27.2, -27.05, 3.6, 3.75, 50.5, 55.3, M.red));
  const lavSign2 = textPlane([{ text: 'STATION LAVAGE', font: '800 92px Inter, Arial' }, { text: 'Chez les Frères Winiger', font: 'italic 600 60px Inter, Arial', color: '#ff4d55' }], 4.4, 1.1, { w: 1024, h: 256 });
  lavSign2.rotation.y = Math.PI / 2; lavSign2.position.set(-9.16, 4.6, 52.9); la.add(lavSign2);
  const inSign = textPlane([{ text: 'ENTRÉE', font: '700 80px Inter, Arial' }], 1.4, 0.32, { w: 512, h: 116, color: '#ffffff' });
  inSign.rotation.y = Math.PI / 2; inSign.position.set(-9.15, 3.95, 52.9); la.add(inSign);
  const outSign = textPlane([{ text: 'SORTIE', font: '700 80px Inter, Arial' }], 1.4, 0.32, { w: 512, h: 116, color: '#ffffff' });
  outSign.rotation.y = -Math.PI / 2; outSign.position.set(-27.21, 3.95, 52.9); la.add(outSign);
  anchors.lavage = new THREE.Vector3(-5.4, 2.2, 25.6);
  zones.push({ id: 'lavage', box: new THREE.Box3(new THREE.Vector3(-9.2, 0, 22.4), new THREE.Vector3(-1.6, 4.8, 28.9)) });
  zones.push({ id: 'lavage', box: new THREE.Box3(new THREE.Vector3(-27.05, 0, 49.2), new THREE.Vector3(-9.3, 5.6, 56.7)) });

  // ------------------------------------------------------------ agrandissement 2026 : charpente en cours, à droite (est), contre le bâtiment
  W.extension = new THREE.Group();
  // d'après les photos du chantier (oct. 2026) : prolonge le volume existant, deux niveaux,
  // poteaux noirs, sommiers rouges, rez en béton et vitrages, étage en panneaux OSB.
  const redSteel = new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.5, metalness: 0.4 });
  const osb = new THREE.MeshStandardMaterial({ map: T.osbTexture(), roughness: 0.9 }); osb.map.repeat.set(3, 1);
  const cols = [];
  for (const x of [-20.6, -24.6, -28.4]) for (const z of [-10.8, -3.6, 3.6, 10.8]) {
    const c = box(0.3, H, 0.3, M.steel, x, H / 2, z); cols.push(c); W.extension.add(c);
  }
  const eg = () => { const o = new THREE.Group(); W.extension.add(o); return o; };
  const beams = [];
  const lvl = H * 0.48;
  const b1 = eg(); b1.add(span(-28.6, -20.3, lvl - 0.25, lvl + 0.1, -11, 11, conc)); for (const z of [-10.8, 10.8]) b1.add(span(-28.6, -20.3, lvl - 0.45, lvl - 0.1, z - 0.15, z + 0.15, redSteel)); beams.push(b1);
  const b2 = eg(); for (const z of [-10.8, -3.6, 3.6, 10.8]) b2.add(span(-28.6, -20.3, H - 0.55, H - 0.15, z - 0.15, z + 0.15, redSteel)); b2.add(span(-28.6, -28.3, H - 0.55, H - 0.15, -11, 11, redSteel)); beams.push(b2);
  const b3 = eg(); b3.add(span(-28.5, -20.5, 0, lvl - 0.3, -10.9, -10.7, conc)); b3.add(span(-28.6, -28.45, 0, lvl - 0.3, -11, 11, conc)); beams.push(b3);
  const b4 = eg(); b4.add(span(-28.5, -20.5, lvl + 0.1, H - 0.6, -10.9, -10.75, osb)); b4.add(span(-28.55, -28.45, lvl + 0.1, H - 0.6, -10.8, 2, osb)); beams.push(b4);
  const b5 = eg(); b5.add(span(-28.3, -20.6, 0.05, lvl - 0.5, 10.95, 11, glassMat(), { cast: false })); beams.push(b5);
  W.extension.add(span(-28.6, -20.3, 0, 0.05, -11, 11, M.paving, { cast: false }));
  for (let i = 0; i < 5; i++) W.extension.add(span(-30.4 - i * 0.6, -30 - i * 0.6, 0, 0.35, 15.5, 21, M.steel));
  W.extension.userData = { cols, beams };
  root.add(W.extension);
  anchors.histoire = new THREE.Vector3(-24.4, 4, 0);

  // ------------------------------------------------------------ éclairages intérieurs (intensités pilotées par le récit)
  const pl = (x, y, z, d = 26) => { const l = new THREE.PointLight(0xfff4e8, 0, d, 1.6); l.position.set(x, y, z); root.add(l); return l; };
  W.lights = { atelier: pl(0, 6.5, 0, 34), resto: pl(-15, 5.5, -4, 18), booth: pl(14, 3.6, -5.5, 14), base1: pl(-9, -1, 0, 24), base2: pl(7, -1, 0, 24) };

  root.traverse((o) => { if (o.isMesh && mobile && o.geometry.attributes.position.count < 30) o.castShadow = false; });
  // textes et logo du bâtiment remis à l'endroit
  root.traverse((o) => { if (o.userData.text) o.scale.x *= -1; });
  // repères et zones du bâtiment : passage en coordonnées du monde
  const siteIds = new Set(['competition', 'lavage']);
  for (const [k, v] of Object.entries(anchors)) if (!siteIds.has(k)) v.x = -v.x;
  for (const z of zones) if (!siteIds.has(z.id)) { const a = -z.box.min.x, b = -z.box.max.x; z.box.min.x = Math.min(a, b); z.box.max.x = Math.max(a, b); }
  return { root: world, W, anchors, zones };
}
