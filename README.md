# Winiger Frères : site V6 (accueil 3D)

Site statique en HTML, CSS et JavaScript. Il fonctionne chez n'importe quel hébergeur (GitHub Pages, Infomaniak ou autre) : aucun serveur, aucune base de données, aucun service externe.

## Accueil 3D

La page d'accueil pose le récit de l'atelier sur une maquette 3D du bâtiment (Three.js), pilotée par le défilement :
le bâtiment s'ouvre, la caméra entre dans l'atelier, descend au sous-sol, passe à la restauration, à la voiture n° 438,
à la station de lavage, puis à l'histoire, aux réalisations et au contact. Le bouton « Explorer le bâtiment en 3D » ouvre
un mode libre (rotation, zoom, repères cliquables).

- Code source de la 3D : `src/3d/` (`building.js` bâtiment et décors, `car.js` véhicules, `story.js` plans de caméra par chapitre, `main.js` rendu et interactions).
- Fichier publié : `assets/js/experience.js`, généré par `npm run build:3d` (esbuild). Il faut relancer cette commande après toute modification de `src/3d/`.
- Les plans de caméra sont exprimés en « blocs de texte » : `s: 0` = bloc d'introduction du chapitre, `s: 1` = première étape, etc.
- Sans WebGL, si l'utilisateur choisit « Version sans 3D », ou si le chargement échoue, la page s'affiche en mise en page classique avec les photos réelles. Le contenu est toujours dans le HTML (référencement).
- Aucun modèle n'est téléchargé : le bâtiment et les véhicules sont générés dans le navigateur. La maquette est **conceptuelle** et l'indique à l'écran (voir `A-CONFIRMER.md`, section 6).

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
