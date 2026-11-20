"""Combine les passes cuites dans Blender en une lightmap pour le site.

Usage : python combine.py scene.json PASS_DIR OUT_DIR
Écrit OUT_DIR/lightmap.webp, OUT_DIR/uv1.bin, OUT_DIR/bake.json.
Unités : Cycles renvoie l'éclairement / π (albédo blanc) ; three.js attend l'éclairement : on multiplie par π.
Les éclairages intérieurs sont réglés pour viser un éclairement au sol (unités three.js, soleil direct ≈ 1,85).
"""
import base64, json, math, os, shutil, sys
import numpy as np
from PIL import Image

scene, pd, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
D = json.load(open(scene)); meta = json.load(open(os.path.join(pd, 'uv.json')))
RES = meta['res']
uv = np.fromfile(os.path.join(pd, 'uv1.bin'), dtype=np.float32).reshape(-1, 2)

def f32(s): return np.frombuffer(base64.b64decode(s), dtype=np.float32)
P = np.concatenate([f32(r['p']).reshape(-1, 3) for r in D['receivers']])  # coordonnées three.js
tri = P.reshape(-1, 3, 3); cen = tri.mean(1)
nrm = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
flips = np.concatenate([np.full(len(f32(r['p'])) // 9, r['flip']) for r in D['receivers']])
nrm[flips] *= -1
nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
area = 0.5 * np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1)
tuv = uv.reshape(-1, 3, 2).mean(1)

def load(n):
    p = os.path.join(pd, n + '.npy')
    return np.load(p) if os.path.exists(p) else None

def sample(img, sel):
    px = np.clip((tuv[sel] * RES).astype(int), 0, RES - 1)
    return img[px[:, 1], px[:, 0]].mean(1)  # tableau Blender : ligne 0 = v 0

# zones en coordonnées three.js (x, z) et hauteur du sol
ZONES = {
    'atelier': ((-19.5, 9.5), (-10.5, 10.5), 0.0, 1.3),
    'resto': ((10.3, 19.7), (-10.7, 2.6), 0.0, 1.4),
    'reception': ((10.3, 19.7), (3.2, 10.7), 0.0, 1.8),
    'base': ((-19.5, 19.5), (-10.5, 10.5), -4.2, 1.3),
    'wash': ((-26.6, -9.8), (49.6, 56.3), 0.03, 1.5),
}
FALLBACK = {'resto': 25.0, 'reception': 22.0, 'wash': 30.0}
L = np.zeros((RES, RES, 3), np.float32)
sky = load('sky'); sun = load('sun')
if sky is not None: L += sky
if sun is not None: L += 3.0 * sun  # intensité du soleil dans la page
weights = {}
for g, ((x0, x1), (z0, z1), fy, target) in ZONES.items():
    img = load(g)
    if img is None: continue
    sel = (cen[:, 0] > x0) & (cen[:, 0] < x1) & (cen[:, 2] > z0) & (cen[:, 2] < z1) & (np.abs(cen[:, 1] - fy) < 0.25) & (nrm[:, 1] > 0.9) & (area > 0.05)
    v = np.median(sample(img, sel)) if sel.any() else 0
    # repli (sol non isolable) : flux des panneaux par m², rendement mesuré dans l'atelier (≈ 0,35)
    w = target / (math.pi * v) if v > 1e-6 else FALLBACK.get(g, 0)
    weights[g] = round(float(w), 3); print(g, 'sol', sel.sum(), 'médiane', round(float(v), 5), 'poids', round(w, 2))
    L += w * img
L *= math.pi

cov = L.max(2) > 0
# débruitage léger : flou gaussien masqué (ne mélange pas les texels vides)
def blur(a, s=1.0):
    r = int(3 * s); k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * s * s)); k /= k.sum()
    for ax in (0, 1):
        a = sum(np.roll(a, i - r, axis=ax) * k[i] for i in range(len(k)))
    return a
m = cov[..., None].astype(np.float32)
Lb = blur(L * m) / np.maximum(blur(m), 1e-4)
L = np.where(cov[..., None], Lb, L)

scale = float(np.percentile(L[cov].max(1), 99.7))
neutral = np.median(L[cov], axis=0)
L[:8, :8] = neutral  # coin (0,0) réservé
enc = np.clip(L / scale, 0, 1)
enc = np.where(enc <= 0.0031308, enc * 12.92, 1.055 * np.power(enc, 1 / 2.4) - 0.055)  # sRGB
im = Image.fromarray((np.flipud(enc) * 255 + 0.5).astype(np.uint8))
im.save(os.path.join(out, 'lightmap.webp'), quality=88, method=6)
shutil.copy(os.path.join(pd, 'uv1.bin'), os.path.join(out, 'uv1.bin'))
json.dump({'count': meta['count'], 'ranges': meta['ranges'], 'light': 'lightmap.webp', 'scale': round(scale, 4), 'weights': weights}, open(os.path.join(out, 'bake.json'), 'w'))
print('échelle', round(scale, 3), 'neutre', neutral.round(3), 'taille', os.path.getsize(os.path.join(out, 'lightmap.webp')) // 1024, 'Ko')
