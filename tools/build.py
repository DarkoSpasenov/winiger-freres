#!/usr/bin/env python3
"""Génère les pages HTML du site Winiger Frères (V5, direction « Nuit de course »).

Usage : python3 tools/build.py   (depuis le dossier du site)

En-tête, pied de page, menus et métadonnées sont définis une seule fois ici.
Modifiez le contenu d'une page dans sa fonction page_xxx(), puis relancez le script.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMGINFO = {
    # nom : (largeur, hauteur, tailles webp disponibles)
    "atelier-peintre": (1568, 1045, [1568, 800]),
    "gardiennage": (744, 496, [744]),
    "pieces-cabine": (744, 744, [744]),
    "mazda-giclage": (744, 744, [744]),
    "tesla-model3": (744, 744, [744]),
    "huracan-bouclier": (744, 744, [744]),
    "huracan-avant": (744, 744, [744]),
    "911-rotissoire-hero": (1568, 1400, [1568, 800]),
    "911-rotissoire-cote": (744, 744, [744]),
    "911-masquage": (744, 744, [744]),
    "911-interieur-appret": (744, 744, [744]),
    "911-giclage-soubassement": (744, 744, [744]),
    "911-soubassement-fini": (744, 744, [744]),
    "993-livraison": (744, 744, [744]),
    "993-detail-jante": (744, 744, [744]),
    "restauration-remorque": (744, 744, [744]),
    "atelier-equipe": (744, 496, [744]),
    "reception": (744, 496, [744]),
    "course-438-profil": (1200, 800, [1200, 800]),
    "course-438-face": (1200, 800, [1200, 800]),
}

TEL = "026 476 06 06"
TEL_HREF = "tel:+41264760606"
WA = "079 457 00 37"
WA_HREF = "https://wa.me/41794570037"
MAIL = "carrosserie@winiger-artcar.ch"
ADDR1 = "Route de l'Industrie-Ouest 11"
ADDR2 = "1772 Grolley"
MAPS = "https://www.google.com/maps/dir/?api=1&destination=Route+de+l%27Industrie-Ouest+11%2C+1772+Grolley"
INSTA = "https://www.instagram.com/carrosserie_winiger_freres_/"
HOURS = [("Lundi à jeudi", "7 h – 12 h, 13 h 30 – 18 h"), ("Vendredi", "7 h – 13 h 30")]

NAV = [
    ("index.html", "Accueil"),
    ("prestations.html", "Prestations"),
    ("restauration.html", "Restauration"),
    ("gardiennage.html", "Gardiennage"),
    ("entreprise.html", "Entreprise"),
    ("competition.html", "Compétition"),
    ("contact.html", "Contact"),
]
ARR = '<span class="arr" aria-hidden="true">→</span>'


def img(name, alt, sizes="100vw", eager=False, pos=None, cls=None):
    w, h, avail = IMGINFO[name]
    largest = max(avail)
    src = f"assets/img/{name}-{min(avail)}.webp"
    srcset = ""
    if len(avail) > 1:
        srcset = ' srcset="' + ", ".join(f"assets/img/{name}-{s}.webp {s}w" for s in sorted(avail)) + f'" sizes="{sizes}"'

    hh = round(h * largest / w)
    load = ' fetchpriority="high"' if eager else ' loading="lazy" decoding="async"'
    style = f' style="object-position:{pos}"' if pos else ""
    c = f' class="{cls}"' if cls else ""
    return f'<img src="{src}"{srcset} width="{largest}" height="{hh}" alt="{alt}"{load}{style}{c}>'


def btn(href, label, kind="red", arrow=True, extra=""):
    a = f" {ARR}" if arrow else ""
    return f'<a class="btn btn-{kind}" href="{href}"{extra}><span>{label}{a}</span></a>'


ICONS = {
    "temp": '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 9v8"/>',
    "lift": '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M12 3v18M8.5 9.5 7 11h3zM15.5 13.5 17 12h-3z" fill="currentColor"/>',
    "cal": '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "car": '<path d="M3 16v-3l2-5h10l4 4h2v4"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="17" cy="16.5" r="2"/><path d="M9.5 16.5h5.5"/>',
}


def icon(k):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">{ICONS[k]}</svg>'


GARD_FEATURES = [
    ("temp", "Sous-sol chauffé", "Votre véhicule passe la saison froide au sec et à température stable."),
    ("lift", "Accès par ascenseur", "Le véhicule rejoint le sous-sol par ascenseur, sans rampe à négocier."),
    ("cal", "Du mois à l'année", "Pour un hivernage, quelques mois ou une année complète."),
    ("car", "Sport et collection", "Un espace pensé pour les voitures de sport et de collection."),
]


def features(items=GARD_FEATURES):
    lis = "".join(f"<li>{icon(i)}<strong>{t}</strong><span>{d}</span></li>" for i, t, d in items)
    return f'<ul class="features">{lis}</ul>'


# ---------------------------------------------------------------- gabarit

def header(current):
    links = "".join(
        f'<a href="{h}"' + (' aria-current="page"' if h == current else "") + f">{l}</a>" for h, l in NAV
    )
    return f'''<a class="skip" href="#main">Aller au contenu</a>
<header class="hdr wrap dark"><div class="inner">
  <a class="logo" href="index.html"><img src="assets/img/logo-winiger-480.webp" srcset="assets/img/logo-winiger-480.webp 480w, assets/img/logo-winiger-960.webp 960w" sizes="110px" width="480" height="258" alt="Winiger Frères, Carrosserie de Grolley : accueil"></a>
  <nav class="nav" id="menu" aria-label="Navigation principale">
    {links}
    <div class="nav-extra"><a href="{TEL_HREF}">Appeler le {TEL}</a>{btn("contact.html#demande", "Demander un devis")}</div>
  </nav>
  <div class="hdr-cta">
    <a class="hdr-tel" href="{TEL_HREF}">{TEL}</a>
    {btn("contact.html#demande", "Demander un devis", arrow=False)}
    <button class="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>
  </div>
</div></header>'''


def footer():
    hours = "".join(f"<li>{d} : {h}</li>" for d, h in HOURS)
    return f'''<footer class="ftr wrap dark"><div class="inner">
  <div class="ftr-grid">
    <div class="stack">
      <a class="logo-f" href="index.html"><img src="assets/img/logo-winiger-480.webp" width="480" height="258" alt="Winiger Frères, accueil" loading="lazy" decoding="async"></a>
      <p>Winiger Frères Sàrl<br>{ADDR1}<br>{ADDR2}</p>
    </div>
    <div><h2>Prestations</h2><ul>
      <li><a href="prestations.html#carrosserie">Carrosserie</a></li>
      <li><a href="prestations.html#peinture">Peinture</a></li>
      <li><a href="prestations.html#tesla">Réparation Tesla</a></li>
      <li><a href="prestations.html#sinistre">Sinistre et vitrage</a></li>
      <li><a href="restauration.html">Restauration</a></li>
      <li><a href="gardiennage.html">Gardiennage</a></li>
    </ul></div>
    <div><h2>L'atelier</h2><ul>
      <li><a href="entreprise.html">L'entreprise</a></li>
      <li><a href="competition.html">Compétition</a></li>
      <li><a href="contact.html">Contact et accès</a></li>
      <li><a href="{INSTA}" rel="noopener">Instagram</a></li>
    </ul></div>
    <div><h2>Horaires</h2><ul>{hours}</ul>
      <p style="margin-top:12px"><a href="{TEL_HREF}">{TEL}</a><br><a href="mailto:{MAIL}">{MAIL}</a></p>
    </div>
  </div>
  <div class="ftr-bottom"><span>© 2026 Winiger Frères Sàrl</span><a href="mentions-legales.html">Mentions légales et confidentialité</a></div>
</div></footer>'''


def cta_band(title, text, href, label):
    return f'''<section class="cta-band wrap" aria-label="Prendre contact"><div class="inner">
  <div class="stack" style="gap:8px"><p class="display">{title}</p><p>{text}</p></div>
  <div class="btns">{btn(href, label, "dark")}<a class="btn btn-ghost" href="{TEL_HREF}"><span>{TEL}</span></a></div>
</div></section>'''


def page_head(crumb, eyebrow, title, lead, extra="", image=None, pos="50% 50%", alt=""):
    media = ""
    if image:
        media = f'''<figure class="ph-media" aria-hidden="{'false' if alt else 'true'}">{img(image, alt, "(max-width:860px) 100vw, 50vw", eager=True, pos=pos)}</figure>
  <div class="lisere" aria-hidden="true"><i></i><i></i><i></i></div>'''
    cls = "page-head dark" + (" has-media" if image else "")
    return f'''<section class="{cls}">
  {media}
  <div class="wrap"><div class="inner">
  <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">{crumb}</span></nav>
  <p class="eyebrow">{eyebrow}</p>
  <h1 class="display h1">{title}</h1>
  <p class="lead">{lead}</p>
  {extra}
  </div></div>
</section>'''


JSONLD = {
    "@context": "https://schema.org",
    "@type": "AutoBodyShop",
    "name": "Winiger Frères Sàrl",
    "alternateName": "Carrosserie de Grolley",
    "telephone": "+41 26 476 06 06",
    "email": MAIL,
    "address": {"@type": "PostalAddress", "streetAddress": ADDR1, "postalCode": "1772",
                "addressLocality": "Grolley", "addressRegion": "FR", "addressCountry": "CH"},
    "foundingDate": "2004",
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"], "opens": "07:00", "closes": "12:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"], "opens": "13:30", "closes": "18:00"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Friday", "opens": "07:00", "closes": "13:30"},
    ],
    "sameAs": [INSTA],
}


def document(file, title, desc, body, wrapped=True, jsonld=False):
    ld = f'\n<script type="application/ld+json">{json.dumps(JSONLD, ensure_ascii=False)}</script>' if jsonld else ""
    head = f'''<title>{title}</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0B0B0C">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/img/911-rotissoire-hero-1568.webp">
<meta property="og:locale" content="fr_CH">
<link rel="preload" href="assets/fonts/montserrat-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
<script>document.documentElement.classList.add('js')</script>{ld}'''
    content = f'''{header(file)}
<main id="main">
{body}
</main>
{footer()}
<script src="assets/js/site.js" defer></script>'''
    if not wrapped:
        # Variante pour l'aperçu Artifact : la page principale est enveloppée par l'hébergeur.
        return head + "\n" + content + "\n"
    return f'''<!doctype html>
<html lang="fr">
<head>
{head}
</head>
<body>
{content}
</body>
</html>
'''


# ---------------------------------------------------------------- pages

def page_index():
    hours = "".join(f"<li><span>{d}</span><span>{h}</span></li>" for d, h in HOURS)
    rail = "".join(
        f'<a class="rail-i" href="{h}"><span class="rail-th">{img(k, "", "120px")}</span><span><span class="rail-n">{i+1:02d}</span><b>{t}</b><small>{d}</small></span><span class="rail-go" aria-hidden="true">→</span></a>'
        for i, (h, k, t, d) in enumerate([
            ("prestations.html#carrosserie", "mazda-giclage", "Carrosserie et peinture", "Toutes marques, en cabine"),
            ("gardiennage.html", "gardiennage", "Gardiennage", "Sous-sol chauffé, à l'année"),
            ("restauration.html", "911-rotissoire-cote", "Restauration", "Caisse sur rotissoire"),
            ("prestations.html#tesla", "tesla-model3", "Tesla Approved", "Atelier agréé depuis 2021"),
        ]))
    tiles = [
        ("restauration.html", "911-rotissoire-hero", "Restauration", "Oldtimers et youngtimers : caisse sur rotissoire, peinture des intérieurs en cabine, jusqu'aux parties que l'on ne voit pas.", "Caisse de Porsche 911 sur rotissoire", "big", ["Rotissoire", "Intérieurs", "Soubassement"]),
        ("prestations.html#carrosserie", "huracan-bouclier", "Carrosserie", "Réparation toutes marques et débosselage, devis gratuit.", "Bouclier avant de Lamborghini Huracán en préparation", "", []),
        ("prestations.html#peinture", "pieces-cabine", "Peinture", "En cabine, de la retouche à la teinte complète, finition mate.", "Pièces de carrosserie dans la cabine de peinture", "", []),
        ("prestations.html#tesla", "tesla-model3", "Tesla", "Atelier du réseau Tesla Approved Body Shop depuis mai 2021.", "Tesla Model 3 en réparation à l'atelier", "", []),
    ]
    bento = ""
    for i, (h, k, t, d, a, cls, chips) in enumerate(tiles):
        ch = "".join(f"<span>{c}</span>" for c in chips)
        bento += f'<a class="tile {cls} rv" href="{h}"><span class="tile-ph">{img(k, a, "(max-width:760px) 100vw, 40vw")}</span><span class="tile-c"><span class="tile-n">{i+1:02d}</span><span class="display tile-t">{t}</span><span class="tile-d">{d}</span>' + (f'<span class="chips">{ch}</span>' if ch else "") + f'<span class="tile-more">En savoir plus {ARR}</span></span></a>'
    bento += f'''<div class="tile red rv"><span class="tile-c"><span class="kicker">Un sinistre ?</span><span class="display tile-t">On s'occupe du reste.</span><span class="tile-d">Démarches d'assurance, pare-brise et vitres, voiture de remplacement.</span><span class="tile-act">{btn("contact.html#demande-sinistre", "Annoncer un sinistre", "dark")}<span class="tile-wa">Urgence WhatsApp<br><a href="{WA_HREF}" rel="noopener">{WA}</a></span></span></span></div>'''
    film_steps = [
        ("911-rotissoire-cote", "Sur rotissoire", "La caisse pivote : chaque recoin devient accessible."),
        ("911-masquage", "Masquage", "Les zones à protéger sont masquées avant peinture."),
        ("911-interieur-appret", "Intérieurs en apprêt", "L'habitacle reçoit son apprêt en cabine."),
        ("911-giclage-soubassement", "Soubassement", "Peint comme le reste de la caisse, grâce à la rotissoire."),
    ]
    film = "".join(f'<li class="frame rv"><span class="frame-n">{i+1:02d}</span><div class="frame-im">{img(k, "", "(max-width:760px) 70vw, 300px")}</div><h3 class="display">{t}</h3><p>{d}</p></li>' for i, (k, t, d) in enumerate(film_steps))
    film += '<li class="frame next" aria-hidden="true"><span class="frame-n">05</span><div class="frame-im"><span>À suivre</span></div><h3 class="display">Prochaine étape</h3><p>Publiée au fil du chantier.</p></li>'
    ig = "".join(f'<li>{img(k, a, "(max-width:760px) 33vw, 16vw")}</li>' for k, a in [
        ("911-soubassement-fini", "Soubassement de la 911 repeint"), ("993-detail-jante", "Roue arrière de la Porsche 993 jaune"),
        ("mazda-giclage", "Peinture d'une Mazda en cabine"), ("restauration-remorque", "Véhicule restauré au départ de l'atelier"),
        ("huracan-avant", "Lamborghini Huracán, bloc avant démonté"), ("911-interieur-appret", "Intérieur de caisse de 911 en apprêt")])
    return f'''
<section class="hx dark" aria-labelledby="h-hero">
  <div class="hx-top">
  <div class="hx-bg">{img("course-438-profil", "Porsche 911 numéro 438 aux couleurs Winiger Frères, Carrosserie de Grolley, en piste", "(max-width:860px) 100vw, 70vw", eager=True)}</div>
  <div class="lisere" aria-hidden="true"><i></i><i></i><i></i></div>
  <p class="hx-credit">Photo : Sébastien Montagny / Sport-Auto.ch</p>
  <div class="wrap hx-in"><div class="inner">
    <div class="hx-text">
      <p class="eyebrow">Carrosserie de Grolley · depuis 2004</p>
      <h1 class="display h1" id="h-hero">Votre voiture mérite <span class="accent">un vrai atelier.</span></h1>
      <p class="lead">Réparation toutes marques, peinture en cabine, restauration de véhicules anciens et gardiennage en sous-sol chauffé, par Richard et Fabrice Winiger et leur équipe.</p>
      <div class="btns">{btn("contact.html#demande", "Demander un devis")}{btn("gardiennage.html", "Réserver une place", "ghost")}</div>
      <p class="hero-tel">Ou appelez l'atelier : <a href="{TEL_HREF}">{TEL}</a></p>
    </div>
  </div></div>
  </div>
  <nav class="rail" aria-label="Accès rapide aux prestations">{rail}</nav>
</section>

<section class="gfiche dark" aria-labelledby="h-gard">
  <figure class="gfiche-ph">{img("gardiennage", "Voitures de sport sous housse rouge dans le sous-sol de gardiennage de l'atelier", "(max-width:860px) 100vw, 48vw", pos="50% 60%")}<span class="fig">Fig. 02 — <b>Sous-sol</b>, Grolley</span></figure>
  <div class="gfiche-stamp" aria-hidden="true"><small>Sous-sol</small><b>Chauffé</b><small>Grolley</small></div>
  <div class="gfiche-tx">
    <p class="eyebrow">Gardiennage</p>
    <h2 class="display h2" id="h-gard">Votre voiture hiverne <span class="accent">au chaud.</span></h2>
    <p class="lead">Un sous-sol chauffé, accessible par ascenseur, pour confier votre voiture de sport ou de collection le temps d'un hiver ou d'une année.</p>
    <dl class="spec"><dt>Lieu</dt><dd>Sous-sol chauffé</dd><dt>Accès</dt><dd>Par ascenseur</dd><dt>Durée</dt><dd>Du mois à l'année</dd><dt>Pour</dt><dd>Sport et collection</dd><dt>Tarif</dt><dd class="accent">Sur demande</dd></dl>
    <div class="btns">{btn("contact.html#demande-gardiennage", "Demander une place")}<a class="link" href="gardiennage.html">Comment ça se passe {ARR}</a></div>
  </div>
</section>

<section class="section wrap film-sec" aria-labelledby="h-film">
  <div class="inner">
    <div class="sec-head">
      <div class="stack"><p class="eyebrow">Dossier en cours</p><h2 class="display h2" id="h-film">Porsche 911, <span class="accent">image par image.</span></h2></div>
      <p class="muted">Restauration commencée en août 2026 : le chantier est suivi en photos, étape par étape.</p>
    </div>
  </div>
  <ol class="film">{film}</ol>
  <div class="inner">
    <div class="track" aria-hidden="true"><span style="width:80%"></span></div>
    <div class="track-cap"><span><b>4 étapes</b> publiées</span><a class="link" href="restauration.html">Suivre le dossier {ARR}</a></div>
  </div>
</section>

<section class="section wrap surface" aria-labelledby="h-hist">
  <div class="inner hist">
    <div class="collage rv">
      <figure class="c-a">{img("atelier-equipe", "L'équipe de Winiger Frères au travail dans l'atelier", "(max-width:860px) 80vw, 34vw")}</figure>
      <figure class="c-b">{img("reception", "Nouvelle réception de l'atelier", "(max-width:860px) 60vw, 24vw")}</figure>
      <p class="c-badge"><small>Depuis</small><span class="display">2004</span></p>
    </div>
    <div class="stack rv">
      <p class="eyebrow">Notre histoire</p>
      <h2 class="display h2" id="h-hist">Deux frères, <span class="accent">un atelier.</span></h2>
      <p class="quote">« Une même passion, une exigence partagée. »</p>
      <p>Fondée en 2004 à Grolley par Richard et Fabrice Winiger, la carrosserie est membre de carrosserie suisse et forme des apprentis. Elle s'agrandit en 2026, avec une nouvelle réception et un showroom.</p>
      <ol class="tl-h"><li class="r"><b>2004</b><span>Fondation à Grolley</span></li><li><b>2021</b><span>Tesla Approved Body Shop</span></li><li class="r"><b class="accent">2026</b><span>Agrandissement et showroom</span></li></ol>
      <a class="link" href="entreprise.html">Découvrir l'entreprise {ARR}</a>
    </div>
  </div>
</section>

<section class="section wrap" aria-labelledby="h-ig">
  <div class="inner">
    <div class="sec-head">
      <div class="stack"><p class="eyebrow">Dans les coulisses</p><h2 class="display h2" id="h-ig">L'atelier, <span class="accent">au quotidien.</span></h2></div>
      <div class="btns">{btn(INSTA, "Suivre l'atelier sur Instagram", "dark", extra=' rel="noopener"')}</div>
    </div>
    <ul class="igg">{ig}</ul>
  </div>
</section>

<section class="contact-red wrap" aria-labelledby="h-contact">
  <span class="cr-ghost" aria-hidden="true">Winiger</span>
  <div class="inner cr-grid">
    <div class="stack"><p class="eyebrow">Contact</p><h2 class="display h2" id="h-contact">Parlons de <br>votre voiture.</h2><p class="lead">Le plus rapide reste le téléphone. Vous pouvez aussi décrire votre demande en ligne.</p></div>
    <div class="cr-card dark">
      <span class="lbl">Téléphone</span><a class="big-tel" href="{TEL_HREF}">{TEL}</a>
      <ul class="cr-rows">
        <li><span>Urgence</span><a href="{WA_HREF}" rel="noopener">WhatsApp {WA}</a></li>
        <li><span>Adresse</span><a href="{MAPS}" rel="noopener">{ADDR1}, {ADDR2}</a></li>
        {hours}
      </ul>
      <div class="btns">{btn("contact.html#demande", "Demander un devis")}</div>
    </div>
  </div>
</section>
'''


def page_prestations():
    sub = '<nav class="subnav" aria-label="Sur cette page"><a href="#carrosserie">Carrosserie</a><a href="#peinture">Peinture</a><a href="#tesla">Tesla</a><a href="#sinistre">Sinistre et vitrage</a><a href="#realisations">Réalisations</a></nav>'
    s = []
    s.append(svc_block("carrosserie", "Carrosserie", "Réparer, <span class=\"accent\">toutes marques.</span>",
        "Du petit choc de parking au sinistre important, l'atelier remet la carrosserie en état et vous remet un devis gratuit avant les travaux.",
        ["Réparation de carrosserie toutes marques", "Débosselage", "Devis gratuit"],
        btn("contact.html#demande-carrosserie", "Demander un devis"),
        img("pieces-cabine", "Pièces de carrosserie préparées avant peinture dans la cabine", "(max-width:860px) 100vw, 50vw")))
    s.append(svc_block("peinture", "Peinture", "La teinte juste, <span class=\"accent\">en cabine.</span>",
        "La peinture est appliquée en cabine, pour une retouche comme pour une teinte complète, avec la possibilité d'une finition mate.",
        ["Peinture en cabine", "Retouche ou teinte complète", "Finition mate"],
        btn("contact.html#demande-peinture", "Parler de votre projet"),
        img("mazda-giclage", "Application de peinture au pistolet sur une Mazda dans la cabine", "(max-width:860px) 100vw, 50vw")))
    s.append(svc_block("tesla", "Tesla Approved Body Shop", "Atelier agréé <span class=\"accent\">Tesla.</span>",
        "Winiger Frères fait partie du réseau Tesla Approved Body Shop depuis mai 2021. Votre Tesla est réparée par un atelier reconnu par le constructeur.",
        ["Membre du réseau depuis mai 2021", "Réparation de carrosserie et peinture", "Devis gratuit"],
        btn("contact.html#demande-tesla", "Demander un devis Tesla"),
        img("tesla-model3", "Tesla Model 3 en réparation à l'atelier", "(max-width:860px) 100vw, 50vw", pos="50% 55%")))
    s.append(svc_block("sinistre", "Sinistre et vitrage", "Après un sinistre, <span class=\"accent\">on s'occupe du reste.</span>",
        "L'atelier vous aide dans les démarches avec votre assurance, remplace pare-brise et vitres, et peut vous prêter une voiture de remplacement pendant les travaux.",
        ["Aide aux démarches de sinistre", "Pare-brise et vitres", "Voiture de remplacement", f'Urgence par WhatsApp : <a class="link" href="{WA_HREF}" rel="noopener">{WA}</a>'],
        btn("contact.html#demande-sinistre", "Annoncer un sinistre")))
    real = f'''<section class="section-tight" id="realisations" aria-labelledby="h-real" tabindex="-1">
  <div class="stack" style="margin-bottom:28px">
    <p class="eyebrow">Réalisation</p>
    <h2 class="display h2" id="h-real">Lamborghini Huracán : <span class="accent">bloc avant.</span></h2>
    <p class="lead">Intervention sur le bloc avant, janvier 2026.</p>
  </div>
  <figure class="rv" style="margin:0;max-width:760px"><div class="media ratio-4x3">{img("huracan-bouclier", "Bouclier avant de la Lamborghini Huracán en préparation sur chevalet", "(max-width:760px) 100vw, 760px")}</div></figure>
</section>'''
    return page_head("Prestations", "Prestations", "Carrosserie, peinture <span class=\"accent\">et sinistres.</span>",
        "Le détail de chaque prestation et la marche à suivre pour obtenir un devis. Pour la restauration et le gardiennage, voir leurs pages dédiées.", sub, image="atelier-peintre", pos="62% 30%") + \
        f'<div class="wrap"><div class="inner">{"".join(s)}{real}</div></div>' + \
        cta_band("Un devis pour votre véhicule ?", "Décrivez les dégâts, ajoutez quelques photos : l'atelier vous rappelle.", "contact.html#demande", "Demander un devis")


def svc_block(id_, eyebrow, title, text, points, cta, media=None):
    pts = "".join(f"<li>{p}</li>" for p in points)
    m = f'<figure class="media ratio-4x3 rv" style="margin:0">{media}</figure>' if media else ""
    cls = "svc" if media else "svc no-media"
    return f'''<section class="{cls}" id="{id_}" aria-labelledby="h-{id_}" tabindex="-1">
  {m}
  <div class="stack rv">
    <p class="eyebrow">{eyebrow}</p>
    <h2 class="display h2" id="h-{id_}">{title}</h2>
    <p class="lead">{text}</p>
    <ul class="points">{pts}</ul>
    <div class="btns" style="margin-top:6px">{cta}</div>
  </div>
</section>'''


def page_restauration():
    steps = [
        ("911-rotissoire-cote", "La caisse sur rotissoire", "La caisse est fixée sur une rotissoire : elle peut pivoter pour que chaque recoin soit accessible, dessous compris.", "Caisse de Porsche 911 fixée sur une rotissoire, vue d'ensemble"),
        ("911-masquage", "Le masquage", "Avant la peinture, les zones à protéger sont masquées avec soin.", "Masquage de la caisse de la Porsche 911 avant peinture"),
        ("911-interieur-appret", "Les intérieurs en apprêt", "L'habitacle et les parties intérieures reçoivent leur apprêt en cabine.", "Intérieur de la caisse de la 911 recouvert d'apprêt"),
        ("911-giclage-soubassement", "Le soubassement", "Grâce à la rotissoire, le soubassement est peint comme le reste de la caisse.", "Peinture au pistolet du soubassement de la 911 retournée"),
    ]
    n = len(steps)
    stage = "".join(
        f'<figure data-step="{i}"' + (' class="on"' if i == 0 else "") + f'>{img(k, a, "(max-width:860px) 100vw, 55vw", pos="50% 50%")}</figure>'
        for i, (k, t, d, a) in enumerate(steps)
    )
    lis = "".join(
        f'<li class="step" data-step="{i}"><div class="step-img">{img(k, "", "100vw")}</div><span class="step-n">Étape {i+1} sur {n}</span><h3 class="display h3">{t}</h3><p>{d}</p></li>'
        for i, (k, t, d, a) in enumerate(steps)
    )
    facts = "".join(f"<dt>{a}</dt><dd>{b}</dd>" for a, b in [
        ("Véhicule", "Porsche 911"), ("Intervention", "Peinture des intérieurs"),
        ("Méthode", "Caisse sur rotissoire, en cabine"), ("Début", "Août 2026"), ("Statut", "En cours")])
    return page_head("Restauration", "Restauration", "Redonner vie <span class=\"accent\">aux anciennes.</span>",
        "Oldtimers et youngtimers : l'atelier démonte, prépare et repeint, jusqu'aux parties que l'on ne voit pas. Exemple avec une Porsche 911 en cours de restauration.", image="911-rotissoire-hero") + f'''
<section class="section wrap" aria-labelledby="h-dossier">
  <div class="inner">
    <div class="split" style="align-items:end;margin-bottom:clamp(32px,5vw,64px)">
      <div class="stack"><p class="eyebrow">Dossier en cours</p><h2 class="display h2" id="h-dossier">Porsche 911 : <span class="accent">les intérieurs.</span></h2></div>
      <dl class="facts">{facts}</dl>
    </div>
    <div class="story">
      <div class="stage" aria-hidden="true">{stage}<span class="stage-count"><span data-count>1</span>/{n}</span></div>
      <ol class="steps">{lis}</ol>
    </div>
  </div>
</section>
<section class="section wrap surface" aria-labelledby="h-autres">
  <div class="inner">
    <div class="stack" style="margin-bottom:28px"><p class="eyebrow">Autres réalisations</p><h2 class="display h2" id="h-autres">Déjà rendues <span class="accent">à leurs propriétaires.</span></h2></div>
    <div class="gallery">
      <figure class="rv"><div class="media ratio-1x1">{img("911-soubassement-fini", "Soubassement de la 911 entièrement repeint", "(max-width:760px) 100vw, 33vw")}</div><figcaption class="caption">Porsche 911 : soubassement terminé.</figcaption></figure>
      <figure class="rv"><div class="media ratio-1x1">{img("993-detail-jante", "Roue arrière et aile de la Porsche 993 jaune après remise en état", "(max-width:760px) 100vw, 33vw")}</div><figcaption class="caption">Porsche 993 : remise en état, livrée en février 2023.</figcaption></figure>
      <figure class="rv"><div class="media ratio-1x1">{img("restauration-remorque", "Véhicule restauré chargé sur une remorque au départ de l'atelier", "(max-width:760px) 100vw, 33vw")}</div><figcaption class="caption">Départ chez son propriétaire, décembre 2020.</figcaption></figure>
    </div>
  </div>
</section>''' + cta_band("Un projet de restauration ?", "Présentez votre véhicule et ce que vous souhaitez faire : l'atelier vous rappelle.", "contact.html#demande-restauration", "Parler de votre projet")


def page_gardiennage():
    steps = [
        ("Envoyez votre demande", "Indiquez le véhicule et la période souhaitée via le formulaire ou par téléphone."),
        ("L'atelier vous rappelle", "Il vous confirme la disponibilité et vous communique le tarif."),
        ("Convenez du dépôt", "Vous fixez ensemble la date à laquelle vous amenez le véhicule."),
    ]
    how = "".join(f"<li><strong>{t}</strong><span>{d}</span></li>" for t, d in steps)
    faq = [
        ("Quel est le tarif ?", "Le tarif dépend du véhicule et de la durée. Il vous est communiqué sur demande, sans engagement."),
        ("Y a-t-il de la place en ce moment ?", "La disponibilité est confirmée au moment de votre demande."),
        ("Pour quelle durée puis-je confier mon véhicule ?", "Du mois à l'année : pour un hivernage, quelques mois ou une année complète."),
        ("Quels véhicules acceptez-vous ?", "Le gardiennage s'adresse aux voitures de sport et de collection. Précisez le modèle dans votre demande."),
        ("Comment se passe le dépôt ?", "La date et les modalités de dépôt sont convenues avec l'atelier lorsqu'il vous rappelle."),
    ]
    faqh = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in faq)
    return page_head("Gardiennage", "Gardiennage", "Gardiennage de voitures <span class=\"accent\">de sport et de collection.</span>",
        "Un sous-sol chauffé, accessible par ascenseur, pour confier votre véhicule du mois à l'année.",
        f'<div class="btns">{btn("contact.html#demande-gardiennage", "Demander une place")}<a class="btn btn-ghost" href="{TEL_HREF}"><span>{TEL}</span></a></div>', image="gardiennage", pos="50% 60%") + f'''
<section class="section wrap" aria-labelledby="h-espace">
  <div class="inner split">
    <div class="stack rv"><p class="eyebrow">L'espace</p><p class="lead">Le sous-sol de l'atelier accueille les voitures de sport et de collection le temps d'un hiver ou d'une année. Le tarif et la disponibilité vous sont confirmés lors de votre demande.</p></div>
    <div class="stack rv">
      <h2 class="display h2" id="h-espace">Ce que <span class="accent">vous trouvez.</span></h2>
      {features()}
    </div>
  </div>
</section>
<section class="section wrap surface" aria-labelledby="h-reserver">
  <div class="inner stack" style="gap:32px">
    <div class="stack"><p class="eyebrow">Réserver</p><h2 class="display h2" id="h-reserver">Trois étapes, <span class="accent">un seul appel.</span></h2></div>
    <ol class="howto">{how}</ol>
    <div class="btns">{btn("contact.html#demande-gardiennage", "Demander une place")}</div>
  </div>
</section>
<section class="section wrap" aria-labelledby="h-faq">
  <div class="inner split" style="align-items:start">
    <div class="stack"><p class="eyebrow">Questions fréquentes</p><h2 class="display h2" id="h-faq">Avant de <span class="accent">réserver.</span></h2></div>
    <div class="faq">{faqh}</div>
  </div>
</section>''' + cta_band("Une place pour cet hiver ?", "Indiquez le véhicule et la période : l'atelier vous confirme la disponibilité et le tarif.", "contact.html#demande-gardiennage", "Demander une place")


def page_entreprise():
    tl = "".join(f"<li><b>{a}</b><span>{b}</span></li>" for a, b in [
        ("2004", "Richard et Fabrice Winiger fondent la carrosserie à Grolley."),
        ("2021", "En mai, l'atelier rejoint le réseau Tesla Approved Body Shop."),
        ("2026", "Agrandissement de l'atelier et nouvelle réception avec showroom."),
    ])
    return page_head("Entreprise", "L'entreprise", "Deux frères, <span class=\"accent\">un atelier.</span>",
        "Une carrosserie familiale, fondée et dirigée par Richard et Fabrice Winiger, qui transmet son métier aux apprentis.", image="atelier-equipe") + f'''
<section class="section wrap" aria-labelledby="h-equipe">
  <div class="inner split wide-media">
    <figure class="media ratio-3x2 rv" style="margin:0">{img("atelier-equipe", "L'équipe de Winiger Frères réunie dans l'atelier", "(max-width:860px) 100vw, 55vw")}</figure>
    <div class="stack rv">
      <h2 class="display h2" id="h-equipe">L'équipe <span class="accent">et le métier.</span></h2>
      <p>La carrosserie répare toutes les marques, peint en cabine et restaure des véhicules anciens. Elle est membre de carrosserie suisse, l'association professionnelle de la branche.</p>
      <p>L'atelier est aussi une entreprise formatrice : il accueille des apprentis dans trois métiers menant à un CFC.</p>
      <a class="link" href="{INSTA}" rel="noopener">Suivre l'atelier sur Instagram {ARR}</a>
    </div>
  </div>
</section>
<section class="section wrap surface" aria-labelledby="h-reperes">
  <div class="inner stack" style="gap:40px">
    <h2 class="display h2" id="h-reperes">Quelques <span class="accent">repères.</span></h2>
    <ol class="timeline">{tl}</ol>
  </div>
</section>
<section class="section wrap" aria-labelledby="h-reception">
  <div class="inner split">
    <div class="stack rv">
      <h2 class="display h2" id="h-reception">Une nouvelle <span class="accent">réception.</span></h2>
      <p class="lead">Avec l'agrandissement de 2026, l'atelier accueille ses clients dans une réception neuve, avec un showroom.</p>
      <a class="link" href="contact.html">Horaires et accès {ARR}</a>
    </div>
    <figure class="media ratio-3x2 rv" style="margin:0">{img("reception", "Nouvelle réception de l'atelier Winiger Frères", "(max-width:860px) 100vw, 50vw")}</figure>
  </div>
</section>''' + cta_band("Envie de passer à l'atelier ?", "Appelez pour convenir d'un moment, ou envoyez votre demande.", "contact.html#demande", "Écrire à l'atelier")


def page_competition():
    facts = "".join(f"<dt>{a}</dt><dd>{b}</dd>" for a, b in [
        ("Voiture", "Porsche 911"), ("Numéro", "438"), ("Livrée", "Winiger Frères, Carrosserie de Grolley")])
    return f'''
<section class="race-hero wrap dark" aria-labelledby="h-race">
  <div class="bg">{img("course-438-profil", "Porsche 911 numéro 438 aux couleurs Winiger Frères en piste, vue de profil", "100vw", eager=True)}</div>
  <div class="shade"></div>
  <span class="race-num" aria-hidden="true">438</span>
  <div class="inner">
    <nav class="crumbs" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a><span aria-hidden="true">/</span><span aria-current="page">Compétition</span></nav>
    <p class="eyebrow">Compétition</p>
    <h1 class="display h1" id="h-race">Le n° 438 <span class="accent">en piste.</span></h1>
    <p class="lead">La passion de l'atelier ne s'arrête pas à la carrosserie : une Porsche 911 aux couleurs de Winiger Frères court sous le numéro 438.</p>
  </div>
</section>
<div class="checker" aria-hidden="true"></div>
<section class="section wrap" aria-labelledby="h-voiture">
  <div class="inner split wide-media">
    <figure style="margin:0" class="rv"><div class="media ratio-3x2">{img("course-438-face", "Porsche 911 numéro 438 vue de face en piste", "(max-width:860px) 100vw, 55vw")}</div><figcaption class="caption">Photos : Sébastien Montagny pour Sport-Auto.ch</figcaption></figure>
    <div class="stack rv">
      <h2 class="display h2" id="h-voiture">La <span class="accent">voiture.</span></h2>
      <dl class="facts">{facts}</dl>
      <p class="muted">La livrée porte le nom de l'atelier : c'est la même exigence de finition qu'en carrosserie.</p>
      <a class="link" href="{INSTA}" rel="noopener">Suivre les sorties sur Instagram {ARR}</a>
    </div>
  </div>
</section>
<div class="checker" aria-hidden="true"></div>''' + cta_band("Votre voiture mérite le même soin.", "Carrosserie, peinture ou gardiennage : parlons de votre véhicule.", "contact.html#demande", "Demander un devis")


SUBJECTS = [
    ("", "Choisissez un objet"),
    ("carrosserie", "Réparation de carrosserie"),
    ("peinture", "Peinture"),
    ("tesla", "Réparation Tesla"),
    ("sinistre", "Sinistre et vitrage"),
    ("restauration", "Restauration"),
    ("gardiennage", "Gardiennage"),
    ("autre", "Autre demande"),
]


def page_contact():
    opts = "".join(f'<option value="{v}"' + (" disabled selected" if not v else "") + f">{l}</option>" for v, l in SUBJECTS)
    hours = "".join(f"{d} : {h}<br>" for d, h in HOURS)
    return page_head("Contact", "Contact", "Parlons <span class=\"accent\">de votre véhicule.</span>",
        "Le plus rapide reste le téléphone. Vous pouvez aussi décrire votre demande ci-dessous.", image="reception") + f'''
<section class="section wrap" aria-label="Coordonnées et demande">
  <div class="inner contact-grid">
    <div class="stack" style="gap:28px">
      <ul class="info-list">
        <li><span class="lbl">Téléphone</span><a class="big-tel" href="{TEL_HREF}">{TEL}</a></li>
        <li><span class="lbl">Urgence sinistre (WhatsApp)</span><a href="{WA_HREF}" rel="noopener">{WA}</a></li>
        <li><span class="lbl">E-mail</span><a href="mailto:{MAIL}">{MAIL}</a></li>
        <li><span class="lbl">Adresse</span>Winiger Frères Sàrl<br>{ADDR1}<br>{ADDR2}<br><a class="link" href="{MAPS}" rel="noopener">Itinéraire {ARR}</a></li>
        <li><span class="lbl">Horaires</span>{hours}</li>
      </ul>
    </div>
    <form class="form" id="demande" tabindex="-1" novalidate aria-labelledby="h-form" aria-describedby="demo-note">
      <h2 class="display h3 full" id="h-form">Votre demande</h2>
      <p class="demo-note" id="demo-note"><span><b>Formulaire de démonstration.</b> Il n'est pas encore relié à l'atelier : aucune donnée n'est envoyée. Pour une demande réelle, appelez le <a href="{TEL_HREF}">{TEL}</a> ou écrivez à <a href="mailto:{MAIL}">{MAIL}</a>.</span></p>
      <div class="field"><label for="f-nom">Nom et prénom *</label><input id="f-nom" name="nom" autocomplete="name" required><span class="err" id="e-nom" hidden></span></div>
      <div class="field"><label for="f-tel">Téléphone *</label><input id="f-tel" name="telephone" type="tel" autocomplete="tel" required><span class="err" id="e-tel" hidden></span></div>
      <div class="field"><label for="f-mail">E-mail</label><input id="f-mail" name="email" type="email" autocomplete="email"><span class="err" id="e-mail" hidden></span></div>
      <div class="field"><label for="f-veh">Véhicule</label><input id="f-veh" name="vehicule" placeholder="Marque, modèle, année"></div>
      <div class="field full"><label for="f-objet">Objet *</label><select id="f-objet" name="objet" required>{opts}</select><span class="err" id="e-objet" hidden></span></div>
      <div class="field full" id="duree-field" hidden><label for="f-duree">Durée souhaitée</label><select id="f-duree" name="duree"><option value="">Je ne sais pas encore</option><option>Quelques mois</option><option>Un hiver</option><option>Une année</option><option>Plus d'une année</option></select></div>
      <div class="field full"><label for="f-msg">Votre message *</label><textarea id="f-msg" name="message" required></textarea><span class="err" id="e-msg" hidden></span></div>
      <div class="field full"><label for="f-photos">Photos</label><span class="hint" id="h-photos">Facultatif : quelques photos des dégâts ou du véhicule.</span><input id="f-photos" name="photos" type="file" accept="image/*" multiple aria-describedby="h-photos"></div>
      <label class="check full"><input type="checkbox" id="f-ok" name="consentement" required><span>J'accepte que mes données soient utilisées pour répondre à ma demande, selon la <a href="mentions-legales.html#confidentialite">politique de confidentialité</a>. *</span></label>
      <span class="err full" id="e-ok" hidden></span>
      <div class="form-status" id="form-status" role="status" hidden></div>
      <div class="form-foot"><span class="small muted">* champs obligatoires</span><button class="btn btn-red" type="submit"><span>Vérifier ma demande {ARR}</span></button></div>
    </form>
  </div>
</section>'''


def page_mentions():
    return page_head("Mentions légales", "Informations légales", "Mentions légales <span class=\"accent\">et confidentialité.</span>",
        "Qui édite ce site et comment les données que vous transmettez sont traitées.") + f'''
<section class="section wrap legal"><div class="inner prose">
  <h2 id="editeur">Éditeur du site</h2>
  <p>Winiger Frères Sàrl<br>{ADDR1}<br>{ADDR2}, Suisse<br>Téléphone : <a href="{TEL_HREF}">{TEL}</a><br>E-mail : <a href="mailto:{MAIL}">{MAIL}</a><br>Numéro IDE : CHE-111.985.169</p>
  <!-- À compléter avant publication : personnes autorisées à représenter la société (registre du commerce). -->
  <!-- À compléter avant publication : hébergeur du site (nom et adresse). -->

  <h2 id="propriete">Propriété intellectuelle</h2>
  <p>Les textes, photographies et le logo de ce site appartiennent à Winiger Frères Sàrl ou à leurs auteurs. Toute reproduction demande une autorisation préalable.</p>
  <p>Photos de compétition : Sébastien Montagny pour Sport-Auto.ch.</p>

  <h2 id="confidentialite">Protection des données</h2>
  <p>Winiger Frères Sàrl traite vos données personnelles conformément à la loi fédérale sur la protection des données (LPD).</p>
  <ul>
    <li><b>Données concernées :</b> celles que vous saisissez dans le formulaire de contact (nom, téléphone, e-mail, véhicule, message, photos) ou que vous transmettez par téléphone ou e-mail.</li>
    <li><b>Finalité :</b> uniquement répondre à votre demande et, le cas échéant, établir un devis ou organiser les travaux.</li>
    <li><b>Transmission :</b> vos données ne sont ni vendues ni cédées à des tiers à des fins commerciales.</li>
    <li><b>Mesure d'audience et cookies :</b> ce site n'utilise ni cookies publicitaires ni outil de suivi. Les polices de caractères sont hébergées avec le site, sans appel à un service externe.</li>
    <li><b>Liens externes :</b> les liens vers Instagram, WhatsApp et Google Maps mènent à des services tiers, soumis à leurs propres règles de confidentialité.</li>
    <li><b>Vos droits :</b> vous pouvez demander à consulter, corriger ou supprimer vos données en écrivant à <a href="mailto:{MAIL}">{MAIL}</a>.</li>
  </ul>
  <!-- À compléter avant publication : service d'envoi du formulaire, lieu de stockage et durée de conservation des demandes. -->
  <p class="small muted">Dernière mise à jour : novembre 2026.</p>
</div></section>'''


PAGES = [
    ("index.html", "Winiger Frères | Carrosserie, restauration et gardiennage à Grolley",
     "Carrosserie toutes marques, peinture en cabine, restauration de véhicules anciens et gardiennage en sous-sol chauffé à Grolley (FR). Atelier agréé Tesla.", page_index, True),
    ("prestations.html", "Prestations de carrosserie et peinture | Winiger Frères, Grolley",
     "Réparation toutes marques, débosselage, peinture en cabine et finition mate, réparation Tesla, sinistres et vitrage à Grolley. Devis gratuit.", page_prestations, False),
    ("restauration.html", "Restauration de véhicules anciens | Winiger Frères",
     "Restauration d'oldtimers et youngtimers à Grolley : caisse sur rotissoire, peinture des intérieurs en cabine. Suivez le dossier d'une Porsche 911.", page_restauration, False),
    ("gardiennage.html", "Gardiennage de voitures de sport et de collection | Winiger Frères",
     "Gardiennage de voitures de sport et de collection en sous-sol chauffé, accès par ascenseur, du mois à l'année, à Grolley.", page_gardiennage, False),
    ("entreprise.html", "L'entreprise | Winiger Frères, Carrosserie de Grolley",
     "Carrosserie familiale fondée en 2004 par Richard et Fabrice Winiger, membre de carrosserie suisse et entreprise formatrice.", page_entreprise, False),
    ("competition.html", "Compétition | Winiger Frères",
     "La Porsche 911 n° 438 aux couleurs de Winiger Frères, Carrosserie de Grolley.", page_competition, False),
    ("contact.html", "Contact et demande de devis | Winiger Frères, Grolley",
     "Téléphone, adresse, horaires et demande de devis pour la carrosserie Winiger Frères à Grolley.", page_contact, False),
    ("mentions-legales.html", "Mentions légales et confidentialité | Winiger Frères",
     "Éditeur du site, propriété intellectuelle et protection des données de Winiger Frères Sàrl.", page_mentions, False),
]


def build(artifact_dir=None):
    for file, title, desc, fn, ld in PAGES:
        body = fn()
        (ROOT / file).write_text(document(file, title, desc, body, jsonld=ld), encoding="utf-8")
        if artifact_dir and file == "index.html":
            Path(artifact_dir, "index.html").write_text(
                document(file, "Winiger Frères, Carrosserie de Grolley", desc, body, wrapped=False, jsonld=ld), encoding="utf-8")
    print(f"{len(PAGES)} pages générées dans {ROOT}")


if __name__ == "__main__":
    import sys
    build(sys.argv[1] if len(sys.argv) > 1 else None)
