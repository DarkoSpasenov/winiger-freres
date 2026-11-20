// Textures générées dans le navigateur (aucun fichier à télécharger) : bardage, sols, enseignes, livrée n° 438.
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat = [1, 1], srgb = true, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Bardage métallique nervuré (vertical), anthracite.
export function claddingTexture() {
  const [c, x] = canvas(256, 64);
  x.fillStyle = '#34373b'; x.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 8; i++) {
    const o = i * 32;
    x.fillStyle = '#2b2e31'; x.fillRect(o, 0, 6, 64);
    x.fillStyle = '#3d4044'; x.fillRect(o + 6, 0, 3, 64);
    x.fillStyle = '#303337'; x.fillRect(o + 20, 0, 2, 64);
  }
  return tex(c);
}
export function claddingBump() {
  const [c, x] = canvas(256, 8);
  x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 8);
  for (let i = 0; i < 8; i++) { x.fillStyle = '#202020'; x.fillRect(i * 32, 0, 6, 8); x.fillStyle = '#c0c0c0'; x.fillRect(i * 32 + 6, 0, 3, 8); }
  return tex(c, { srgb: false });
}

// Sol époxy clair de l'atelier, légers joints.
export function epoxyTexture() {
  const [c, x] = canvas(256, 256);
  x.fillStyle = '#e9e8e4'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.025})`; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  x.strokeStyle = 'rgba(0,0,0,.06)'; x.lineWidth = 2; x.strokeRect(0, 0, 256, 256);
  return tex(c);
}

// Béton du sous-sol avec marquage des places.
export function concreteTexture() {
  const [c, x] = canvas(256, 256);
  x.fillStyle = '#c9c7c2'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { const g = 150 + Math.random() * 70; x.fillStyle = `rgba(${g},${g},${g - 4},.10)`; x.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
  return tex(c);
}

// Plafond en panneaux de fibragglo (laine de bois), comme sur la photo du sous-sol.
export function woodwoolTexture() {
  const [c, x] = canvas(256, 256);
  x.fillStyle = '#dcd6cb'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    x.strokeStyle = `rgba(${150 + Math.random() * 60},${130 + Math.random() * 50},${100 + Math.random() * 40},.35)`;
    const px = Math.random() * 256, py = Math.random() * 256, a = Math.random() * Math.PI;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); x.stroke();
  }
  x.strokeStyle = 'rgba(80,70,60,.35)'; x.lineWidth = 2; x.strokeRect(1, 1, 254, 254);
  return tex(c);
}

// Panneau de texte (enseignes, numéros de place). Fond transparent par défaut.
export function textTexture(lines, { w = 1024, h = 256, bg = null, color = '#fff', font = '700 120px Inter, Arial, sans-serif', align = 'center', italic = false, pad = 40 } = {}) {
  const [c, x] = canvas(w, h);
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = color; x.textBaseline = 'middle'; x.textAlign = align;
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((l, i) => {
    const f = typeof l === 'string' ? font : l.font;
    const t = typeof l === 'string' ? l : l.text;
    x.font = (italic ? 'italic ' : '') + f;
    if (typeof l !== 'string' && l.color) x.fillStyle = l.color; else x.fillStyle = color;
    const ax = align === 'center' ? w / 2 : align === 'left' ? pad : w - pad;
    x.fillText(t, ax, (h / (arr.length + 1)) * (i + 1));
  });
  const t = tex(c, { repeat: [1, 1] });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Livrée simplifiée de la Porsche 911 n° 438 (d'après les photos de course) : panneau blanc bordé de rouge,
// nom de l'atelier et numéro. frontRight = l'avant de la voiture est à droite de la texture.
export function liveryTexture(frontRight = true) {
  const W = 1024, H = 256;
  const [c, x] = canvas(W, H);
  x.clearRect(0, 0, W, H);
  x.save();
  if (!frontRight) { x.translate(W, 0); x.scale(-1, 1); }
  // bande rouge basse
  x.fillStyle = '#d2101a';
  x.beginPath(); x.moveTo(0, 200); x.lineTo(W, 168); x.lineTo(W, 214); x.lineTo(0, 246); x.closePath(); x.fill();
  // panneau blanc incliné bordé de rouge
  x.fillStyle = '#d2101a';
  x.beginPath(); x.moveTo(60, 40); x.lineTo(W - 70, 22); x.lineTo(W - 10, 150); x.lineTo(120, 186); x.closePath(); x.fill();
  x.fillStyle = '#f4f4f2';
  x.beginPath(); x.moveTo(84, 54); x.lineTo(W - 84, 38); x.lineTo(W - 36, 140); x.lineTo(134, 172); x.closePath(); x.fill();
  x.restore();
  // textes (jamais en miroir)
  const nameX = frontRight ? 170 : W - 170;
  const numX = frontRight ? W - 210 : 210;
  x.fillStyle = '#16171a'; x.textBaseline = 'middle';
  x.textAlign = frontRight ? 'left' : 'right';
  x.font = 'italic 900 50px Inter, Arial, sans-serif';
  x.fillText('WINIGER FRÈRES', nameX, 92);
  x.fillStyle = '#c40d16'; x.font = 'italic 800 30px Inter, Arial, sans-serif';
  x.fillText('CARROSSERIE DE GROLLEY', nameX, 140);
  x.fillStyle = '#16171a'; x.textAlign = 'center'; x.font = 'italic 900 112px Inter, Arial, sans-serif';
  x.fillText('438', numX, 100);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// Logo officiel (extraction de l'enseigne, fond transparent) chargé depuis le site.
export function loadLogo(url) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Petit sprite rond pour les gouttes et la brume.
export function dotTexture() {
  const [c, x] = canvas(64, 64);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

// Enrobé (asphalte) du parking : gris foncé, granulats, légères taches. Comme sur les photos de la cour.
export function asphaltTexture() {
  const [c, x] = canvas(512, 512);
  x.fillStyle = '#5b5d5f'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26; i++) {
    const r = 30 + Math.random() * 90, gx = Math.random() * 512, gy = Math.random() * 512;
    const g = x.createRadialGradient(gx, gy, 0, gx, gy, r);
    const d = Math.random() < 0.5 ? '40,42,44' : '120,122,124';
    g.addColorStop(0, `rgba(${d},.10)`); g.addColorStop(1, `rgba(${d},0)`);
    x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2);
  }
  for (let i = 0; i < 22000; i++) {
    const v = Math.random() < 0.5 ? 40 + Math.random() * 30 : 110 + Math.random() * 60;
    x.fillStyle = `rgba(${v},${v},${v + 2},${0.25 + Math.random() * 0.35})`;
    const s = Math.random() < 0.9 ? 1 : 2;
    x.fillRect(Math.random() * 512, Math.random() * 512, s, s);
  }
  return tex(c, { aniso: 8 });
}
export function asphaltRough() {
  const [c, x] = canvas(256, 256);
  x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 150 + Math.random() * 105; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(Math.random() * 256, Math.random() * 256, 1, 1); }
  return tex(c, { srgb: false });
}

// Gazon et talus autour du bâtiment.
export function grassTexture() {
  const [c, x] = canvas(512, 512);
  x.fillStyle = '#66704a'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 30; i++) {
    const r = 40 + Math.random() * 120, gx = Math.random() * 512, gy = Math.random() * 512;
    const g = x.createRadialGradient(gx, gy, 0, gx, gy, r);
    const d = Math.random() < 0.5 ? '84,92,58' : '122,124,86';
    g.addColorStop(0, `rgba(${d},.35)`); g.addColorStop(1, `rgba(${d},0)`);
    x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2);
  }
  for (let i = 0; i < 26000; i++) {
    const gr = 90 + Math.random() * 60;
    x.fillStyle = `rgba(${gr - 18 + Math.random() * 20},${gr},${gr - 45},.45)`;
    x.fillRect(Math.random() * 512, Math.random() * 512, 1, 2 + Math.random() * 2);
  }
  return tex(c, { aniso: 8 });
}
