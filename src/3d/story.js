// Plans de caméra et états de la scène, par chapitre.
// s = position dans le chapitre, en « blocs de texte » : 0 = bloc d'introduction, 1 = première étape, etc.
// (les fractions sont permises). pos / tgt en mètres.
// open : façade et toit retirés (0..1). cut : coupe du terrain devant le sous-sol (0..1).
// ext : charpente de l'agrandissement (0..1). dim : voile clair sur la scène (0..1).
export const SHOTS = {
  hero: [
    { s: 0, pos: [-34, 50, 80], tgt: [-2, 0, 8], open: 0, cut: 0, ext: 0, dim: 0 },
    { s: 0.6, pos: [-24, 36, 62], tgt: [-5, 1, 6], open: 0 },
  ],
  carrosserie: [
    { s: 0, pos: [24, 26, 50], tgt: [-6, 1, 3], open: 1 },
    { s: 1, pos: [-24, 9, 32], tgt: [-9, 1, 12] },
    { s: 2, pos: [-12, 8.5, 18], tgt: [-2, 2.2, 1] },
    { s: 3, pos: [-8, 5.5, 11], tgt: [-2.4, 2.2, 1] },
    { s: 4, pos: [-20, 10.5, 15], tgt: [-14, 1.2, -5.5] },
    { s: 5, pos: [-24, 7, 31], tgt: [-11, 1, 15] },
  ],
  gardiennage: [
    { s: 0, pos: [-20, 9, 36], tgt: [-3, -1, 6], open: 1, cut: 0 },
    { s: 1, pos: [-2, -0.8, 27], tgt: [3, -2.6, 0], cut: 1 },
    { s: 2, pos: [-9, -0.4, 22], tgt: [-16, -2, 4] },
    { s: 3, pos: [14, -1.0, 20], tgt: [6, -3, -6], cut: 1 },
  ],
  restauration: [
    { s: 0, pos: [2, 9, 22], tgt: [15, 1.2, -4], open: 1, cut: 0 },
    { s: 1, pos: [4, 8, 2], tgt: [15, 1.4, -4.5] },
    { s: 2.5, pos: [8.5, 6.5, 4], tgt: [15, 1.4, -4.5] },
    { s: 4, pos: [17.5, 6.5, 5], tgt: [15, 1.2, -4.5] },
  ],
  competition: [
    { s: 0, pos: [13, 4, 21], tgt: [4.2, 0.8, 16.6], open: 0, cut: 0 },
    { s: 1, pos: [5, 1.6, 23.5], tgt: [4.2, 0.8, 16.6] },
    { s: 1.6, pos: [-5, 2.4, 20], tgt: [4.2, 0.8, 16.6] },
  ],
  lavage: [
    { s: 0, pos: [16, 16, 8], tgt: [-6, 1.5, 30], open: 0 },
    { s: 1, pos: [-4.5, 4.5, 14], tgt: [-7.4, 1, 25.6] },
    { s: 2, pos: [-1, 7, 72], tgt: [-12.8, 2.6, 56.7] },
    { s: 3, pos: [22, 42, 80], tgt: [-6, 0, 38] },
  ],
  histoire: [
    { s: 0, pos: [64, 50, 64], tgt: [8, 0, 0], ext: 0, open: 0, dim: 0 },
    { s: 1, pos: [66, 40, 48], tgt: [12, 0, 0], ext: 0 },
    { s: 2, pos: [64, 34, 42], tgt: [14, 0, 0], ext: 0.02 },
    { s: 3, pos: [58, 26, 36], tgt: [22, 2, 0], ext: 1 },
  ],
  realisations: [
    { s: -0.3, pos: [-14, 64, 54], tgt: [-0, 0, 2], ext: 1, dim: 0.8, open: 1 },
    { s: 0.3, pos: [14, 60, 54], tgt: [-0, 0, 2], dim: 0.8 },
  ],
  contact: [
    { s: 0, pos: [-3, 6, 20], tgt: [14, 2.2, 11], dim: 0, open: 0, ext: 1 },
  ],
};

// Zones cliquables (mode exploration) : cadrage d'arrivée.
export const PLACES = {
  carrosserie: { label: 'Atelier · carrosserie et peinture', shot: { pos: [-12, 12, 26], tgt: [-2, 1.5, 0] } },
  gardiennage: { label: 'Sous-sol · gardiennage', shot: { pos: [-4, -0.8, 25], tgt: [1, -2.6, 0] } },
  restauration: { label: 'Restauration', shot: { pos: [7, 7, 10], tgt: [15, 1.6, -4.5] } },
  competition: { label: 'Compétition · n° 438', shot: { pos: [12, 3, 22], tgt: [4.2, 0.8, 16.6] } },
  lavage: { label: 'Stations de lavage', shot: { pos: [-3, 6, 14], tgt: [-6, 1.2, 26] } },
  contact: { label: 'Réception', shot: { pos: [-3, 5, 19], tgt: [15, 2, 8] } },
};
