// Détoure le logo officiel (logo.png du site winiger-artcar.ch) : supprime le fond blanc et
// l'effet « page cornée » sans redessiner le logo. Sortie : public/brand/logo-winiger-freres.png
import sharp from 'sharp';
const SRC = '_src/winiger/logo-original.png';
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const x0 = 0, y0 = 0, w = Math.min(W, 224), h = 80; // logo + « CARROSSERIE DE GROLLEY » (la ligne de slogan est tronquée par l'effet de page)
const out = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const i = ((y + y0) * W + (x + x0)) * 4, o = (y * w + x) * 4;
  const a0 = data[i + 3] / 255;
  const r = data[i] * a0 + 255 * (1 - a0), g = data[i + 1] * a0 + 255 * (1 - a0), b = data[i + 2] * a0 + 255 * (1 - a0);
  const isRed = r > 120 && r - g > 70 && r - b > 60;
  let R, G, B, A;
  if (isRed) {
    // rouge : alpha selon la distance au blanc sur le canal vert
    A = Math.min(255, (255 - g) * 1.05);
    const k = A / 255 || 1;
    R = Math.min(255, (r - 255 * (1 - k)) / k); G = Math.max(0, (g - 255 * (1 - k)) / k); B = Math.max(0, (b - 255 * (1 - k)) / k);
  } else {
    // noir : alpha selon la luminance ; les gris clairs (ombre de la page cornée) disparaissent
    const L = 0.3 * r + 0.59 * g + 0.11 * b;
    A = L > 150 ? 0 : Math.min(255, ((150 - L) / 150) * 255 * 1.25);
    R = G = B = 23;
  }
  if (x >= 200 && y >= 50 && !isRed && 0.3 * r + 0.59 * g + 0.11 * b > 70) A = 0; // coin de l'effet « page cornée »
  out[o] = R; out[o + 1] = G; out[o + 2] = B; out[o + 3] = Math.round(A);
}
await sharp(out, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toFile('public/brand/logo-winiger-freres.png');
const m = await sharp('public/brand/logo-winiger-freres.png').metadata();
console.log('logo', m.width, m.height);
