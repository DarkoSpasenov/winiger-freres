# Éclairage précalculé (Blender / Cycles)

La lumière des éléments fixes de la maquette (ciel, rebonds du soleil, néons de l'atelier, du sous-sol,
de la restauration, de la réception et du lavage automatique) est calculée dans Blender puis stockée
dans `assets/bake/` (lightmap + coordonnées de texture). Le soleil direct et ses ombres restent en temps réel.

À refaire après toute modification de la géométrie de `src/3d/building.js` (sinon la page ignore
l'éclairage précalculé, sans erreur visible).

1. `npm run build`, puis servir le dépôt : `python3 -m http.server 8768`
2. Exporter la scène : ouvrir `index.html?instant&bakeexport` et enregistrer le résultat de
   `window.__bakeExport()` dans `scene.json` (script Playwright possible).
3. Blender en module Python (`pip install bpy`) :
   `python bake_blender.py scene.json assets/hdr/pedestrian_overpass_1k.hdr passes/ 2048 128`
   (environ 20 minutes sur 4 cœurs).
4. `python combine.py scene.json passes/ assets/bake/`

Désactiver pour comparer : `index.html?nobake`.
