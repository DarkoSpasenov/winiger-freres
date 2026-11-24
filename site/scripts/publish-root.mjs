// Publie la version consultable (chemins relatifs) à la racine du dépôt, pour GitHub Pages
// (Settings → Pages → « Deploy from a branch », main, / (root)).
import { cp, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
const ROOT = '..';
const KEEP = new Set(['site', '.git', '.gitignore', 'README.md', '.nojekyll', 'visite-3d']); // visite-3d : ancienne version avec la maquette 3D, publiée à part
for (const e of await readdir(ROOT)) if (!KEEP.has(e)) await rm(path.join(ROOT, e), { recursive: true, force: true });
await cp('preview', ROOT, { recursive: true });
await writeFile(path.join(ROOT, '.nojekyll'), '');
console.log('Site publié à la racine du dépôt.');
