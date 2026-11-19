// Bâtiment de la carrosserie : représentation CONCEPTUELLE. Le volume (boîte en bardage anthracite, bande vitrée,
// marquises « Réception » et « Atelier », enseigne) reprend les photos publiques du bâtiment ; la disposition
// intérieure, les dimensions et le nombre de places sont indicatifs.
import * as THREE from 'three';
import * as T from './textures.js';
import { makeCar, paint, addRearWing, carMaterials } from './car.js';

const RED = 0xc8101a;

export const M = {
  poche: new THREE.MeshStandardMaterial({ color: 0x1c1d1f, roughness: 0.9 }),
  ground: new THREE.MeshStandardMaterial({ color: 0xe2dfd8, roughness: 1 }),
  paving: new THREE.MeshStandardMaterial({ color: 0xd3d0c9, roughness: 0.95 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf1f0ec, roughness: 0.85 }),
  red: new THREE.MeshStandardMaterial({ color: RED, roughness: 0.45, metalness: 0.1 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5, metalness: 0.6 }),
  grey: new THREE.MeshStandardMaterial({ color: 0x55585d, roughness: 0.6, metalness: 0.2 }),
  lightGrey: new THREE.MeshStandardMaterial({ color: 0xb9bbbe, roughness: 0.55, metalness: 0.3 }),
  line: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
  led: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.4 }),
  figure: new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.7 }),
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

function clad(w, h) {
  const t = T.claddingTexture(); t.repeat.set(Math.max(1, w / 2.4), 1);
  const b = T.claddingBump(); b.repeat.set(Math.max(1, w / 2.4), 1);
  return new THREE.MeshStandardMaterial({ map: t, bumpMap: b, bumpScale: 0.6, roughness: 0.55, metalness: 0.35, color: 0xffffff });
}

const glassMat = () => new THREE.MeshPhysicalMaterial({ color: 0x2b3a44, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.38, envMapIntensity: 1.5, depthWrite: false });

// Personnage de maquette (silhouette neutre, pas un portrait).
export function figure(h = 1.78) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, h * 0.5, 6, 12), M.figure);
  body.position.y = h * 0.45; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), M.figure);
  head.position.y = h * 0.86; head.castShadow = true;
  g.add(body, head);
  return g;
}

function textPlane(lines, w, h, opts) {
  const t = T.textTexture(lines, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
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

export function buildWorld({ logoUrl, mobile }) {
  const root = new THREE.Group();
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

  // Cour : dallage, marquage des places
  const court = span(-34, 40, 0, 0.02, 15, 34, M.paving, { cast: false }); root.add(court);
  root.add(span(-20.5, 20.5, 0, 0.02, 13.2, 15, M.paving, { cast: false }));
  for (let i = 0; i < 9; i++) root.add(span(-30 + i * 3, -29.9 + i * 3, 0.02, 0.03, 24, 29, M.line, { cast: false }));
  root.add(span(-30, -6, 0.02, 0.03, 28.9, 29, M.line, { cast: false }));

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
  const coverCar = makeCar({ type: 'coupe', mode: 'cover' });
  const coverSedan = makeCar({ type: 'sedan', mode: 'cover' });
  const bayX = [-18.2, -15.6, -12.4, -9.8, -7.2, -4.0, -1.4, 2.0, 4.6, 7.2, 10.4, 13.0];
  bayX.forEach((x, i) => {
    const c = (i % 3 === 1 ? coverSedan : coverCar).clone();
    c.rotation.y = Math.PI / 2; c.position.set(x, -4.2, -8.3); bs.add(c);
    bs.add(span(x - 1.32, x - 1.28, -4.19, -4.18, -11, -5.6, M.line, { cast: false }));
    const n = textPlane(String(i + 1), 0.6, 0.6, { w: 128, h: 128, font: '600 90px Inter, Arial', color: '#ffffff' });
    n.rotation.x = -Math.PI / 2; n.position.set(x, -4.17, -5.2); bs.add(n);
  });
  [-16.5, -12.8, -9.1, -2.6, 1.1, 4.8].forEach((x, i) => {
    const c = (i % 2 ? coverSedan : coverCar).clone();
    c.rotation.y = -Math.PI / 2; c.position.set(x, -4.2, 7.6); bs.add(c);
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
  for (let i = 0; i < 7; i++) W.door.add(span(8.05, 13.95, i * 0.655, i * 0.655 + 0.62, 11.05, 11.15, M.lightGrey));
  F.add(W.door);
  // marquises
  F.add(span(-20.6, -12.5, 3.55, 3.85, 11.3, 13.6, M.steel));
  F.add(span(7.3, 14.7, 4.85, 5.15, 11.3, 13.9, M.steel));
  const tie = (x) => { const r = box(0.06, 0.06, 3.6, M.steel, x, 6.2, 12.6); r.rotation.x = -0.62; F.add(r); };
  tie(7.8); tie(14.2);
  // enseigne et lettrages
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 8.2 * 516 / 960), new THREE.MeshStandardMaterial({ map: T.loadLogo(logoUrl), transparent: true, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.0 }));
  logo.position.set(-4.5, 6.05, fz + 0.17); F.add(logo);
  const recep = textPlane('RÉCEPTION', 3.2, 0.5, { w: 1024, h: 160, font: '600 96px Inter, Arial', color: '#ffffff' });
  recep.position.set(-16.5, 3.08, fz + 0.18); F.add(recep);
  const atel = textPlane('ATELIER', 2.6, 0.5, { w: 1024, h: 160, font: '600 104px Inter, Arial', color: '#ffffff' });
  atel.position.set(11, 5.6, fz + 0.18); F.add(atel);
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
  bo.add(span(bx0, bx1, 0.01, 0.06, bz0, bz1, new THREE.MeshStandardMaterial({ color: 0x3a3d41, roughness: 0.6, metalness: 0.6 }), { cast: false }));
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
  const stand = (x) => {
    const s = new THREE.Group();
    const a = box(0.18, 1.9, 0.18, M.red, 0, 0.95, 0.55); a.rotation.x = 0.28;
    const b = box(0.18, 1.9, 0.18, M.red, 0, 0.95, -0.55); b.rotation.x = -0.28;
    s.add(a, b, box(0.3, 0.12, 1.9, M.red, 0, 0.06, 0), box(0.4, 0.4, 0.3, M.steel, 0, 1.8, 0));
    s.position.set(x, 0, -4.5); return s;
  };
  rs.add(stand(-18.3), stand(-11.7));
  W.rotisserie = new THREE.Group(); W.rotisserie.position.set(-15, 1.8, -4.5); rs.add(W.rotisserie);
  W.shellMat = paint(0x9fa2a3, { metal: 0.05, rough: 0.6, clear: 0.2 });
  W.shell = makeCar({ type: 'coupe', mode: 'shell', material: W.shellMat });
  W.shell.position.set(0, -0.7, 0); W.rotisserie.add(W.shell);
  W.rotisserie.add(box(6.4, 0.12, 0.12, M.steel, 0, 0, 0));
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
  const race = new THREE.Group(); root.add(race);
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
  W.race.position.set(-3, 0, 21.5); W.race.rotation.y = -0.45;
  race.add(W.race);
  anchors.competition = new THREE.Vector3(-3, 1, 21.5);
  zones.push({ id: 'competition', box: new THREE.Box3(new THREE.Vector3(-6, 0, 19), new THREE.Vector3(0, 1.6, 24)) });
  // voitures de clients devant la réception (comme sur les photos du bâtiment)
  const p1 = makeCar({ type: 'coupe', color: RED }); p1.rotation.y = -Math.PI / 2; p1.position.set(-18, 0, 18.5); root.add(p1);
  const p2 = makeCar({ type: 'sedan', color: 0xeeeeec }); p2.rotation.y = -Math.PI / 2; p2.position.set(-15, 0, 18.5); root.add(p2);

  // ------------------------------------------------------------ station de lavage (d'après la photo publiée le 22.08.2026)
  const lv = new THREE.Group(); root.add(lv);
  lv.add(span(22, 34.6, 0, 0.04, -6.5, 12, M.wet, { cast: false }));
  for (const x of [22.4, 28.3, 34.2]) for (const z of [0, 10.6]) lv.add(box(0.3, 4.3, 0.3, M.red, x, 2.15, z));
  lv.add(span(22, 34.6, 4.3, 4.65, -0.3, 11, M.steel));
  lv.add(span(22, 34.6, 4.3, 4.95, 10.75, 11.05, M.red));
  // cloisons de piste avec la silhouette de voiture (comme sur la photo)
  const sep = new THREE.MeshStandardMaterial({ map: T.textTexture('', { w: 8, h: 8, bg: '#c9c9c6' }), color: 0xc9c9c6, roughness: 0.7 });
  lv.add(span(28.15, 28.45, 0.3, 3.0, 1, 9.8, sep));
  lv.add(span(22, 34.6, 0, 4.3, -0.3, 0, clad(12.6, 4.3)));
  // local fermé « Station lavage »
  lv.add(span(22, 34.6, 0, 5.4, -6.5, -0.3, clad(12.6, 5.4)));
  const lavSign = textPlane([{ text: 'LAVAGE HAUTE PRESSION', font: '700 64px Inter, Arial' }], 6, 0.42, { w: 1024, h: 72, color: '#ffffff' });
  lavSign.position.set(28.3, 4.62, 11.07); lv.add(lavSign);
  const lavSign2 = textPlane([{ text: 'STATION LAVAGE', font: '800 92px Inter, Arial' }, { text: 'Chez les Frères Winiger', font: 'italic 600 60px Inter, Arial', color: '#ff4d55' }], 6.4, 1.6, { w: 1024, h: 256 });
  lavSign2.rotation.y = Math.PI / 2; lavSign2.position.set(34.62, 4.2, -3.4); lv.add(lavSign2);
  // bornes de paiement (carte et Twint, d'après la publication)
  for (const x of [23.0, 33.6]) { lv.add(box(0.35, 1.3, 0.3, M.steel, x, 0.65, 9.9)); lv.add(box(0.28, 0.2, 0.02, M.led, x, 1.12, 10.06, { cast: false })); }
  W.washCar = makeCar({ type: 'sedan', color: 0x2f4d6b });
  W.washCar.rotation.y = Math.PI / 2; W.washCar.position.set(25.35, 0.04, 5.2); lv.add(W.washCar);
  W.foamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0, depthWrite: false });
  W.foam = new THREE.Group();
  const fb = new THREE.Mesh(W.washCar.userData.body.geometry, W.foamMat); fb.scale.setScalar(1.012);
  const fc = new THREE.Mesh(W.washCar.userData.cabin.geometry, W.foamMat); fc.scale.setScalar(1.012);
  W.foam.add(fb, fc); W.washCar.add(W.foam);
  W.washer = figure(); W.washer.position.set(27.3, 0.04, 6.5); lv.add(W.washer);
  W.lance = box(0.04, 0.04, 1.1, M.steel, 0, 1.2, 0); lv.add(W.lance);
  anchors.lavage = new THREE.Vector3(28.3, 2.2, 5);
  zones.push({ id: 'lavage', box: new THREE.Box3(new THREE.Vector3(22, 0, -6.5), new THREE.Vector3(34.6, 5.4, 11)) });

  // ------------------------------------------------------------ agrandissement 2026 : charpente en cours (position indicative)
  W.extension = new THREE.Group();
  const cols = [];
  for (const x of [-35, -30, -25]) for (const z of [-10.5, -3.5, 3.5, 10.5]) {
    const c = box(0.35, H, 0.35, M.steel, x, H / 2, z); cols.push(c); W.extension.add(c);
  }
  const beams = [];
  for (const z of [-10.5, -3.5, 3.5, 10.5]) { const b = span(-35.2, -20.3, H - 0.5, H - 0.1, z - 0.15, z + 0.15, M.steel); beams.push(b); W.extension.add(b); }
  for (let i = 0; i < 5; i++) W.extension.add(span(-31 + i * 0.6, -30.6 + i * 0.6, 0, 0.35, 16, 22, M.steel));
  W.extension.userData = { cols, beams };
  root.add(W.extension);
  anchors.histoire = new THREE.Vector3(-28, 4, 0);

  // ------------------------------------------------------------ éclairages intérieurs (intensités pilotées par le récit)
  const pl = (x, y, z, d = 26) => { const l = new THREE.PointLight(0xfff4e8, 0, d, 1.6); l.position.set(x, y, z); root.add(l); return l; };
  W.lights = { atelier: pl(0, 6.5, 0, 34), resto: pl(-15, 5.5, -4, 18), booth: pl(14, 3.6, -5.5, 14), base1: pl(-9, -1, 0, 24), base2: pl(7, -1, 0, 24) };

  root.traverse((o) => { if (o.isMesh && mobile && o.geometry.attributes.position.count < 30) o.castShadow = false; });
  return { root, W, anchors, zones };
}
