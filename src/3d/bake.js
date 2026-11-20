// Éclairage précalculé (Blender / Cycles) : lumière indirecte, ciel et éclairages intérieurs
// cuits dans une texture (lightmap), appliqués aux éléments fixes de la maquette.
// Les éléments animés (portes, ascenseur, voitures, silhouettes) restent éclairés en temps réel.
import * as THREE from 'three';

// Ordre de parcours déterministe : l'index de chaque maillage fixe sert de clé avec le fichier cuit.
export function collectStatic(world, W) {
  const moving = new Set(['lift', 'liftCar', 'door', 'liftArms', 'mechanic', 'painter', 'rotisserie', 'shell', 'masking',
    'storyCar', 'damage', 'race', 'washCar', 'foam', 'washer', 'lance', 'extension', 'plug']
    .map((k) => W[k]).filter((o) => o && o.isObject3D));
  const receivers = [], occluders = [];
  world.updateMatrixWorld(true);
  const walk = (o, mode) => {
    if (moving.has(o)) return;
    if (o.userData.car || o.userData.fig) mode = 'occ';
    if (o.isMesh && !o.isInstancedMesh) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const solid = mats.every((m) => m && !m.isMeshBasicMaterial && !(m.userData.baseTransparent ?? m.transparent) && m.visible !== false);
      if (solid && o.visible) (mode === 'occ' ? occluders : receivers).push(o);
    }
    for (const c of o.children) walk(c, mode);
  };
  walk(world, 'rec');
  return { receivers, occluders };
}

const flat = (g) => (g.index ? g.toNonIndexed() : g.clone());

// ------------------------------------------------------------------ export (outil de développement, ?bakeexport)
function avgColor(tex) {
  const img = tex && tex.image;
  if (!img || !img.width) return null;
  const c = document.createElement('canvas'); c.width = c.height = 8;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, 8, 8);
  const d = x.getImageData(0, 0, 8, 8).data; const a = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) { a[0] += d[i]; a[1] += d[i + 1]; a[2] += d[i + 2]; }
  return a.map((v) => new THREE.Color().setRGB(v / 64 / 255, 0, 0, THREE.SRGBColorSpace).r);
}
const b64 = (arr) => { const u = new Uint8Array(arr.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };

export function exportStatic({ receivers, occluders }, extra) {
  const dump = (list) => list.map((o) => {
    const g = flat(o.geometry); const pos = g.attributes.position; const nor = g.attributes.normal;
    const n = pos.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), E = new Float32Array(n);
    const nm = new THREE.Matrix3().getNormalMatrix(o.matrixWorld); const v = new THREE.Vector3();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const matOf = (i) => { if (!Array.isArray(o.material)) return o.material; const gr = g.groups.find((q) => i >= q.start && i < q.start + q.count); return mats[gr ? gr.materialIndex : 0]; };
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); P.set([v.x, v.y, v.z], i * 3);
      if (nor) { v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.set([v.x, v.y, v.z], i * 3); }
      const m = matOf(i); const avg = m.map ? avgColor(m.map) : null;
      const col = m.color ? [m.color.r, m.color.g, m.color.b] : [0.5, 0.5, 0.5];
      const k = avg ? [col[0] * avg[0], col[1] * avg[1], col[2] * avg[2]] : col;
      C.set(m.metalness > 0.5 ? k.map((q) => q * 0.5) : k, i * 3);
      E[i] = m.emissive && m.emissiveIntensity > 0.5 && m.emissive.getHex() !== 0 ? m.emissiveIntensity : 0;
    }
    return { flip: o.matrixWorld.determinant() < 0, p: b64(P), n: b64(N), c: b64(C), e: b64(E) };
  });
  return JSON.stringify({ receivers: dump(receivers), occluders: dump(occluders), ...extra });
}

// ------------------------------------------------------------------ application
export async function applyBake({ receivers }, base, { onMaterial } = {}) {
  const meta = await fetch(base + 'bake.json').then((r) => r.json());
  const uvName = meta.uv || 'uv1.bin';
  // variante base64 (.b64.txt) pour les hébergements qui refusent les fichiers binaires
  const uvBuf = uvName.endsWith('.b64.txt')
    ? await fetch(base + uvName).then((r) => r.text()).then((t) => Uint8Array.from(atob(t.trim()), (c) => c.charCodeAt(0)).buffer)
    : await fetch(base + uvName).then((r) => r.arrayBuffer());
  if (meta.count !== receivers.length) { console.warn('bake: scène modifiée, éclairage précalculé ignoré'); return false; }
  const tl = new THREE.TextureLoader();
  const load = (f, srgb) => new Promise((res, rej) => tl.load(base + f, (t) => { t.channel = 1; if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, rej));
  const light = await load(meta.light, true);
  const uv = new Float32Array(uvBuf);
  const mats = new Set();
  receivers.forEach((o, i) => {
    const [off, n] = meta.ranges[i];
    const g = flat(o.geometry);
    if (g.attributes.position.count !== n) return;
    g.setAttribute('uv1', new THREE.BufferAttribute(uv.subarray(off * 2, (off + n) * 2), 2));
    o.geometry = g;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) mats.add(m);
  });
  for (const m of mats) {
    m.lightMap = light; m.lightMapIntensity = meta.scale;
    m.needsUpdate = true;
    if (onMaterial) onMaterial(m);
  }
  return mats;
}

// Les maillages non cuits qui partagent un matériau cuit lisent le coin (0,0) de la lightmap, réservé à une valeur neutre.
export function guardShared(root, mats) {
  root.traverse((o) => {
    if (!o.isMesh || o.geometry.attributes.uv1) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    if (!list.some((m) => mats.has(m))) return;
    const g = o.geometry.clone();
    g.setAttribute('uv1', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    o.geometry = g;
  });
}
