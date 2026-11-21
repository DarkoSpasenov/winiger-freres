# Winiger Frères — site internet

Site de **Winiger Frères Sàrl, Carrosserie de Grolley**. Concept : *Swiss Motorsport Heritage*.
Statique, rapide, sans base de données : Astro 5 (génération HTML), CSS maison, ~6 Ko de JavaScript, aucune dépendance d'animation.

## Démarrer

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # site de production dans dist/
npm run preview:local  # copie consultable par double-clic : preview/index.html
```

`npm run images` régénère les variantes WebP (480/960/1440/1920 px) depuis `_src/winiger/` et détoure le logo (`scripts/extract-logo.mjs`). Les images générées sont déjà dans `public/images/`.

## Structure

```
src/data/site.ts        toutes les données de l'entreprise (vérifiées) : coordonnées, horaires, tarifs, prestations
src/data/images.ts      inventaire des photographies officielles + textes alternatifs
src/styles/global.css   système graphique (couleurs, typographie, grille, boutons, circuit)
src/scripts/circuit.ts  le tracé du circuit, le marqueur et la tour de chronométrage
src/scripts/main.ts     révélations, menu mobile, horaires du jour, formulaire, visionneuse
src/components/         Header, Footer, Pic (images responsives), Btn, Sector, Placeholder, Todo, Hours, ContactForm
src/pages/              accueil, entreprise, carrosserie, prestige-collection, gardiennage,
                        station-de-lavage, locaux, contact, mentions-legales, confidentialite, 404
```

Pour modifier un horaire, un tarif ou un texte de prestation : `src/data/site.ts` uniquement.

## Direction artistique

- **Palette** : blanc #FFFFFF (fondation), blanc cassé #F5F5F3, graphite #17191B, gris métal #8A8D90, **rouge #E2001A** échantillonné sur le logo officiel. Sur fond sombre, petits textes rouges en #FF5C6C pour le contraste.
- **Typographie** : Archivo (variable, axe de largeur poussé à 125 % pour les titres « expanded ») + IBM Plex Mono pour les numérotations, codes de secteurs et chiffres façon chronométrage. Polices auto-hébergées.
- **Grille** : 12 colonnes, marges 20–92 px, compositions asymétriques ; les titres s'adaptent à la largeur de leur colonne (container queries).
- **Circuit** : un seul tracé par page relie des points de passage placés à la main dans les blancs de la mise en page (attribut `data-wp`). Virages arrondis, trait rouge dessiné au défilement, marqueur, secteurs S1–S8, damier de départ (hero) et d'arrivée (contact). Sur desktop large, la « tour de chronométrage » à droite sert de navigation secondaire. Sur mobile, le tracé devient une fine ligne de progression à gauche.
- **Motifs** : vibreur rouge/blanc (soulignements de boutons, séparateurs), damier issu du logo-enseigne, marquages au sol (gardiennage, voie de lavage).
- **Animation** : révélation des photos par un balayage en biais, apparition douce des titres ; tout est désactivé avec `prefers-reduced-motion`.
- **3D** : volontairement non utilisée. Aucun modèle photoréaliste et léger des véhicules de l'entreprise n'existe ; une 3D générique aurait desservi la crédibilité et les performances.

## Formulaire

Sans configuration, le formulaire ouvre la messagerie du visiteur avec un e-mail prérempli vers carrosserie@winiger-artcar.ch (le site l'annonce clairement). Pour un envoi direct, définir au build :

```bash
PUBLIC_FORM_ENDPOINT="https://…" npm run build   # Formspree, Web3Forms, script PHP de l'hébergeur…
```

Le point d'accès reçoit un POST `multipart/form-data` (champs : nom, tel, email, sujet, vehicule, message, consent) et doit répondre 2xx.

## Sources et vérification (21.11.2026)

Vérifié sur winiger-artcar.ch (toutes les pages), la fiche local.ch et la page Facebook officielle :
fondation 2004 par deux frères, Richard et Fabrice Winiger, adresse, téléphones, e-mail, horaires (samedi sur rendez-vous selon local.ch), prestations, TESLA Approved Body Shop depuis mai 2021 (toujours mis en avant sur Facebook en novembre 2026), Repanet Suisse, Carrosserie Suisse (FCR), assurances partenaires, gardiennage (sous-sol chauffé, ascenseur, 1 mois à 1 an, CHF 200.–/mois, 1'000.– l'hivernage 6 mois, 2'500.–/an), **tunnel de lavage dernière génération** (affiche officielle + local.ch) au Rte de l'Industrie-Ouest 7.

Instagram n'a pas pu être consulté (connexion requise).

## À compléter avec l'entreprise (badges « À compléter » sur le site)

- Station de lavage : horaires d'accès, moyens de paiement, programmes, équipements, gabarit, fonctionnement (libre-service ou non), tarifs actuels (l'affiche de lancement indiquait « dès 10.– »), **photos réelles du tunnel**.
- Portraits et parcours de Richard et Fabrice Winiger.
- Année d'installation dans le bâtiment actuel et d'ouverture du tunnel.
- Photos : débosselage, remplacement de pare-brise, restaurations récentes, compétition (engagements, palmarès).
- Gardiennage : capacité, entretien pendant le stockage, modalités d'accès, TVA.
- Mentions légales : numéro IDE/CHE, registre du commerce, TVA, hébergeur.
- **Logo vectoriel** (SVG/PDF) : seul un PNG de 316 px avec effet « page cornée » est en ligne ; il a été détouré sans être redessiné.

## Mise en ligne

Le dossier `dist/` se dépose tel quel sur n'importe quel hébergement statique (Infomaniak, Netlify, etc.). Les URL utilisent des dossiers (`/gardiennage/`). Prévoir des redirections 301 depuis les anciennes URL WordPress : `/nos-services/` → `/carrosserie/`, `/nos-locaux/` → `/locaux/`, `/notre-entreprise/` → `/entreprise/`, `/nous-trouver/` → `/contact/`, `/tesla/` → `/prestige-collection/#tesla`, `/assurances-2/` → `/entreprise/#reseau`.
