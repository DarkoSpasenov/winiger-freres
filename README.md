# Winiger Frères : site V5

Site statique en HTML, CSS et JavaScript, sans dépendance externe. Il fonctionne chez n'importe quel hébergeur (Infomaniak ou autre).

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil : vue d'ensemble, gardiennage mis en avant, choix de la prestation |
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
| `tools/build.py` | Génère les 8 pages à partir d'un en-tête et d'un pied de page communs |

## Modifier le site

Les textes se trouvent dans `tools/build.py`, une fonction par page (`page_index`, `page_gardiennage`…).
Téléphone, adresse, horaires et liens sont définis une seule fois en haut du fichier.

```
python3 tools/build.py
```

Le script réécrit les 8 fichiers HTML. Ne modifiez pas les fichiers HTML à la main, sinon la prochaine génération écrasera vos changements.

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
