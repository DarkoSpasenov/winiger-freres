# Winiger Frères : site V7 (accueil en photos réelles + maquette 3D)

Site statique en HTML, CSS et JavaScript. Il fonctionne chez n'importe quel hébergeur (GitHub Pages, Infomaniak ou autre) : aucun serveur, aucune base de données, aucun service externe.

## Accueil

L'accueil propose trois affichages, au choix du visiteur (liens « Affichage » sous le titre, mémorisés dans `localStorage`, clé `wfmode`) :

1. **Photos** (par défaut) : le récit défile dans les vraies photos de l'atelier, une par bloc de texte, en plein écran.
   Fondu enchaîné entre les photos, lent travelling avant, léger relief à la souris. Une photo n'est jamais agrandie
   au-delà de 1,25 fois sa définition : trop petite pour le plein écran, elle est posée en tirage sur un fond flou tiré d'elle-même.
   Script : `assets/js/photo-story.js` (sans dépendance, environ 11 Ko). Les photos sont déclarées dans `tools/build.py`
   avec `ph(nom, légende, point d'intérêt)` sur chaque étape.
2. **Maquette 3D** : le récit d'origine sur la maquette Three.js du bâtiment, pilotée par le défilement.
3. **Sans animation** : mise en page classique, avec les mêmes textes et photos.

Dans les deux premiers modes, « Explorer le bâtiment en 3D » ouvre la maquette en exploration libre (rotation, zoom,
repères cliquables). En mode Photos, la maquette n'est téléchargée qu'au moment du clic.

- Code source de la 3D : `src/3d/` (`building.js` bâtiment et décors, `car.js` véhicules, `story.js` plans de caméra par chapitre, `main.js` rendu et interactions).
- Fichier publié : `assets/js/experience.js`, généré par `npm run build:3d` (esbuild). Il faut relancer cette commande après toute modification de `src/3d/`.
- Les plans de caméra sont exprimés en « blocs de texte » : `s: 0` = bloc d'introduction du chapitre, `s: 1` = première étape, etc.
- Sans JavaScript, sans WebGL (pour la 3D) ou si le chargement échoue, la page s'affiche en mise en page classique. Le contenu est toujours dans le HTML (référencement).
- La maquette est **conceptuelle** et l'indique à l'écran (voir `A-CONFIRMER.md`, section 6).
- Pour un rendu plus net sur grand écran, remplacer les photos de 744 px par des originaux plus grands (voir `A-CONFIRMER.md`, section 6 bis).

```
npm install          # une seule fois (esbuild et three)
npm run build        # pages HTML + 3D
```

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil 3D : récit par espace, histoire, réalisations, contact |
| `lavage.html` | Station de lavage (informations publiées par l'atelier) |
| `prestations.html` | Carrosserie, peinture, Tesla, sinistre et vitrage, réalisation Huracán |
| `restauration.html` | Restauration, avec le dossier de la Porsche 911 en cours |
| `gardiennage.html` | Gardiennage : ce que l'on trouve, comment réserver, questions fréquentes |
| `entreprise.html` | L'entreprise, l'équipe, quelques repères |
| `competition.html` | La Porsche 911 n° 438 (seule page avec le damier) |
| `contact.html` | Coordonnées, horaires et formulaire de demande (démonstration) |
| `mentions-legales.html` | Mentions légales et protection des données |
| `assets/css/site.css` | Toute la mise en forme |
| `assets/js/site.js` | Menu mobile, apparitions, dossier 911, formulaire |
| `assets/img/` | Images au format WebP, redimensionnées |
| `assets/fonts/` | Polices Montserrat et Inter, hébergées avec le site |
| `assets/css/experience.css` | Mise en forme de l'accueil 3D |
| `assets/js/experience.js` | Maquette 3D (généré, ne pas modifier à la main) |
| `src/3d/` | Sources de la maquette 3D |
| `tools/build.py` | Génère les 9 pages à partir d'un en-tête et d'un pied de page communs |

## Modifier le site

Les textes se trouvent dans `tools/build.py`, une fonction par page (`page_index`, `page_gardiennage`…).
Téléphone, adresse, horaires et liens sont définis une seule fois en haut du fichier.

```
python3 tools/build.py
```

Le script réécrit les 9 fichiers HTML. Ne modifiez pas les fichiers HTML à la main, sinon la prochaine génération écrasera vos changements.

## Formulaire

Le formulaire est une **démonstration** : il vérifie les champs mais n'envoie rien, et le dit clairement à l'utilisateur.
Pour le brancher, remplacez le bloc commenté « Aucun envoi » dans `assets/js/site.js` par l'appel au service choisi
(formulaire de l'hébergeur, service tiers ou script serveur). Retirez alors le bandeau `demo-note` dans `page_contact()`
et complétez la section Protection des données des mentions légales.

Les liens `contact.html#demande-gardiennage`, `#demande-tesla`, `#demande-carrosserie`, `#demande-peinture`,
`#demande-sinistre` et `#demande-restauration` présélectionnent l'objet de la demande.

## Avant la mise en ligne

Voir `A-CONFIRMER.md`. Les commentaires `<!-- À compléter -->` dans `mentions-legales.html` signalent les informations manquantes ; ils ne s'affichent pas à l'écran.

## Licences

Les polices Montserrat et Inter sont publiées sous licence SIL Open Font License 1.1 et peuvent être hébergées avec le site.
Les photos appartiennent à Winiger Frères ou à leurs auteurs. Les photos de compétition sont de Sébastien Montagny pour Sport-Auto.ch.
