// Véhicules simplifiés, modélisés par extrusion d'un profil latéral puis déformés (pincement du pavillon,
// arrondi des extrémités). Ce sont des volumes de présentation, pas des modèles constructeur.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

function shapeFrom(cmds) {
  const s = new THREE.Shape();
  for (const c of cmds) {
    const [k, ...a] = c;
    if (k === 'm') s.moveTo(a[0], a[1]);
    else if (k === 'l') s.lineTo(a[0], a[1]);
    else if (k === 'q') s.quadraticCurveTo(a[0], a[1], a[2], a[3]);
    else if (k === 'arc') s.absarc(a[0], a[1], a[2], a[3], a[4], true);
  }
  return s;
}

const A0 = Math.PI + 0.12, A1 = -0.12;
const PROFILES = {
  coupe: {
    width: 1.84, wheelR: 0.33, wheels: [1.45, -1.35],
    body: (ra = 0.41, by = 0.28) => [['m', -2.22, 0.30], ['l', -1.35 - ra, by], ['arc', -1.35, 0.33, ra, A0, A1], ['l', 1.45 - ra, by], ['arc', 1.45, 0.33, ra, A0, A1],
      ['l', 2.18, 0.30], ['q', 2.32, 0.34, 2.30, 0.52], ['q', 2.22, 0.70, 1.70, 0.80], ['l', 0.95, 0.90], ['l', -1.45, 1.00], ['l', -1.52, 1.06],
      ['q', -1.85, 0.99, -2.05, 0.92], ['q', -2.28, 0.86, -2.30, 0.70], ['l', -2.22, 0.30]],
    cabin: [['m', 1.00, 0.88], ['q', 0.55, 1.14, 0.22, 1.27], ['q', -0.25, 1.36, -0.72, 1.28], ['q', -1.20, 1.19, -1.58, 1.05], ['l', -1.50, 0.94], ['l', 0.95, 0.84]],
    roof: [['m', 0.20, 1.275], ['q', -0.25, 1.375, -0.70, 1.292], ['l', -0.69, 1.25], ['q', -0.25, 1.33, 0.18, 1.24]],
    beltY: 0.95, lights: { head: [2.08, 0.66, 0.60], tail: [-2.27, 0.80] },
  },
  sedan: {
    width: 1.86, wheelR: 0.34, wheels: [1.43, -1.43],
    body: (ra = 0.42, by = 0.30) => [['m', -2.32, 0.32], ['l', -1.43 - ra, by], ['arc', -1.43, 0.34, ra, A0, A1], ['l', 1.43 - ra, by], ['arc', 1.43, 0.34, ra, A0, A1],
      ['l', 2.25, 0.33], ['q', 2.40, 0.38, 2.36, 0.58], ['q', 2.25, 0.80, 1.55, 0.88], ['l', 0.85, 0.95], ['l', -1.60, 1.00],
      ['q', -2.20, 1.02, -2.35, 0.92], ['q', -2.40, 0.80, -2.38, 0.62], ['l', -2.32, 0.32]],
    cabin: [['m', 0.92, 0.92], ['q', 0.40, 1.22, 0.00, 1.40], ['q', -0.60, 1.48, -1.10, 1.36], ['q', -1.50, 1.22, -1.78, 1.01], ['l', -1.70, 0.95], ['l', 0.85, 0.90]],
    roof: null, beltY: 0.98, lights: { head: [2.22, 0.68, 0.66], tail: [-2.36, 0.86] },
  },
};

function extrude(shape, depth, bevel = 0.06, curveSegments = 10) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel * 1.4, bevelSize: bevel, bevelSegments: 3, curveSegments,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

// Pincement : le pavillon rentre vers l'intérieur, les extrémités s'arrondissent en plan.
function taper(g, { beltY, top = 0.24, end = 0.13, halfL = 2.3 }) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    let f = 1 - top * smooth((y - beltY) / 0.42);
    f *= 1 - end * smooth((Math.abs(x) - (halfL - 0.62)) / 0.62);
    f *= 1 - 0.05 * smooth((0.42 - y) / 0.2); // bas de caisse légèrement rentré
    p.setZ(i, p.getZ(i) * f);
  }
  g.computeVertexNormals();
  return g;
}

export const carMaterials = {
  glass: new THREE.MeshPhysicalMaterial({ color: 0x14181d, roughness: 0.05, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.92 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.28, metalness: 0.95 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x202226, roughness: 0.6, metalness: 0.2 }),
  head: new THREE.MeshStandardMaterial({ color: 0xf3f1ea, emissive: 0xfff6e0, emissiveIntensity: 0.6, roughness: 0.2 }),
  tail: new THREE.MeshStandardMaterial({ color: 0x8a0a10, emissive: 0xd0101a, emissiveIntensity: 0.5, roughness: 0.3 }),
  cover: new THREE.MeshStandardMaterial({ color: 0xb4141c, roughness: 0.88, metalness: 0 }),
};

export function paint(color, { metal = 0.35, rough = 0.32, clear = 1 } = {}) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: metal, roughness: rough, clearcoat: clear, clearcoatRoughness: 0.08, envMapIntensity: 1.2 });
}

let wheelGeo = null;
function wheel(r) {
  if (!wheelGeo) {
    const tire = new THREE.CylinderGeometry(1, 1, 0.26, 32); tire.rotateX(Math.PI / 2);
    const rim = new THREE.CylinderGeometry(0.68, 0.68, 0.27, 24); rim.rotateX(Math.PI / 2);
    const spokes = [];
    for (let i = 0; i < 5; i++) {
      const s = new THREE.BoxGeometry(0.16, 1.2, 0.04); s.translate(0, 0, 0.13); s.rotateZ((i / 5) * Math.PI);
      spokes.push(s);
    }
    wheelGeo = { tire, rim, spokes: mergeGeometries(spokes) };
  }
  const g = new THREE.Group();
  const t = new THREE.Mesh(wheelGeo.tire, carMaterials.tire);
  const m = new THREE.Mesh(wheelGeo.rim, carMaterials.dark);
  const s = new THREE.Mesh(wheelGeo.spokes, carMaterials.rim);
  const s2 = s.clone(); s2.rotation.y = Math.PI;
  g.add(t, m, s, s2);
  g.scale.setScalar(r);
  t.castShadow = true;
  return g;
}

/**
 * Crée une voiture.
 * type : 'coupe' | 'sedan' ; mode : 'car' (complète) | 'shell' (caisse nue) | 'cover' (sous housse)
 */
export function makeCar({ type = 'coupe', color = 0xc8c9cb, material = null, mode = 'car', wide = 1 } = {}) {
  const P = PROFILES[type];
  const W = P.width * wide;
  const group = new THREE.Group();
  const bodyMat = mode === 'cover' ? carMaterials.cover : (material || paint(color));
  const cover = mode === 'cover';

  const bodyShape = shapeFrom(cover ? P.body(0.42, 0.06) : P.body());
  const bodyGeo = taper(extrude(bodyShape, W - 0.2, cover ? 0.1 : 0.06), { beltY: P.beltY, top: 0.0 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  const cabGeo = taper(extrude(shapeFrom(P.cabin), W * 0.84 - 0.14, cover ? 0.08 : 0.05), { beltY: P.beltY + 0.05, top: 0.26 });
  const cabin = new THREE.Mesh(cabGeo, mode === 'car' ? carMaterials.glass : bodyMat);
  cabin.castShadow = true;
  group.add(cabin);

  if (P.roof && mode !== 'cover') {
    const rg = taper(extrude(shapeFrom(P.roof), W * 0.6, 0.03), { beltY: P.beltY + 0.05, top: 0.1 });
    const roof = new THREE.Mesh(rg, bodyMat);
    group.add(roof);
  }

  const wheels = [];
  if (mode === 'car') {
    for (const wx of P.wheels) for (const sz of [1, -1]) {
      const w = wheel(P.wheelR);
      w.position.set(wx, P.wheelR, sz * (W / 2 - 0.17));
      if (sz < 0) w.rotation.y = Math.PI;
      group.add(w); wheels.push(w);
    }
    // phares et feux
    const [hx, hy, hz] = P.lights.head;
    const hg = new THREE.SphereGeometry(0.11, 16, 12); hg.scale(0.6, 0.8, 1.3);
    for (const sz of [1, -1]) { const h = new THREE.Mesh(hg, carMaterials.head); h.position.set(hx, hy, sz * hz); group.add(h); }
    const [tx, ty] = P.lights.tail;
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, W * 0.82), carMaterials.tail); tl.position.set(tx, ty, 0); group.add(tl);
  }
  group.userData = { body, cabin, wheels, bodyMat, width: W, type };
  return group;
}

// Aileron arrière type course (Porsche 911 n° 438 : aileron à col de cygne).
export function addRearWing(car, mat) {
  const g = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 1.75), mat);
  plane.position.set(0, 0.42, 0); plane.rotation.z = 0.12;
  const endA = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.02), mat); endA.position.set(-0.02, 0.38, 0.88);
  const endB = endA.clone(); endB.position.z = -0.88;
  const up1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.03), carMaterials.dark); up1.position.set(0.05, 0.2, 0.3);
  const up2 = up1.clone(); up2.position.z = -0.3;
  g.add(plane, endA, endB, up1, up2);
  g.position.set(-1.98, 0.86, 0);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  car.add(g);
  return g;
}
