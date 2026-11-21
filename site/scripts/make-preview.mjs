// Construit une copie « aperçu local » de dist/ consultable par double-clic (file://) :
// chemins relatifs, liens vers index.html, script inliné. Le site de production reste dist/.
import { readdir, readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
const SRC = 'dist', OUT = 'preview';
await rm(OUT, { recursive: true, force: true });
await cp(SRC, OUT, { recursive: true });
async function* walk(d) { for (const e of await readdir(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) yield* walk(p); else yield p; } }
for await (const f of walk(OUT)) {
  if (f.endsWith('.css')) {
    const css = await readFile(f, 'utf8');
    await writeFile(f, css.replace(/url\(\/_astro\//g, 'url(./'));
    continue;
  }
  if (!f.endsWith('.html')) continue;
  const depth = path.relative(OUT, path.dirname(f)).split(path.sep).filter(Boolean).length;
  const pre = depth ? '../'.repeat(depth) : './';
  let html = await readFile(f, 'utf8');
  // inline du script module
  html = await replaceAsync(html, /<script type="module" src="\/(_astro\/[^"]+)"><\/script>/g, async (_, src) =>
    `<script type="module">${(await readFile(path.join(OUT, src), 'utf8')).replace(/<\/script/g, '<\\/script')}</script>`);
  const fix = (u) => {
    if (!u.startsWith('/') || u.startsWith('//')) return u;
    const [p, hash = ''] = u.split('#');
    let r = p.slice(1);
    if (r === '' || r.endsWith('/')) r += 'index.html';
    return pre + r + (hash ? '#' + hash : '');
  };
  html = html.replace(/(href|src)="(\/[^"]*)"/g, (_, a, u) => `${a}="${fix(u)}"`);
  html = html.replace(/srcset="([^"]+)"/g, (_, s) => `srcset="${s.split(',').map((x) => { const [u, w] = x.trim().split(/\s+/); return `${fix(u)} ${w}`; }).join(', ')}"`);
  await writeFile(f, html);
}
async function replaceAsync(str, re, fn) { const parts = []; let last = 0; for (const m of str.matchAll(re)) { parts.push(str.slice(last, m.index), await fn(...m)); last = m.index + m[0].length; } parts.push(str.slice(last)); return parts.join(''); }
console.log('Aperçu local prêt : preview/index.html');
