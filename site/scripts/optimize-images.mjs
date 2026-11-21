// Génère les variantes responsives WebP des photographies officielles.
// Entrée : _src/winiger/*.(webp|jpg|jpeg|png)  →  Sortie : public/images/<nom>-<largeur>.webp
// Le logo est traité séparément par scripts/extract-logo.mjs
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = '_src/winiger';
const OUT = 'public/images';
const WIDTHS = [480, 960, 1440, 1920];
await mkdir(OUT, { recursive: true });
await mkdir('public/brand', { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(webp|jpe?g|png)$/i.test(f));
for (const f of files) {
  const name = f.replace(/\.[^.]+$/, '');
  if (name.startsWith('logo') || name.startsWith('cert-') || name === 'tesla-approved') continue;
  const input = path.join(SRC, f);
  const meta = await sharp(input).metadata();
  const widths = [...new Set(WIDTHS.filter((w) => w < meta.width).concat(meta.width))];
  for (const w of widths) {
    const out = path.join(OUT, `${name}-${w}.webp`);
    if (existsSync(out)) continue;
    await sharp(input).resize({ width: w }).webp({ quality: 74, effort: 5 }).toFile(out);
  }
  console.log(`✓ ${name} (${meta.width}×${meta.height}) → ${widths.join(', ')}`);
}
