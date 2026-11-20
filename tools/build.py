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
    # photos du site officiel, page « Nos locaux » (publiées en juin 2021)
    "batiment-facade": (2400, 1600, [2400, 1600, 800]),
    "batiment-entree": (2400, 1600, [2400, 1600, 800]),
    "batiment-cote": (2400, 1599, [2400, 1600, 800]),
    "batiment-enseigne": (2400, 1600, [2400, 1600, 800]),
    "atelier-vue": (2048, 1152, [2048, 800]),
    "atelier-redressage": (1024, 768, [1024, 800]),
    "reception-hd": (2400, 1600, [2400, 1600, 800]),
    "finition-roue": (2400, 1600, [2400, 1600, 800]),
    # station de lavage : publication Instagram de l'atelier du 22 août 2026 (photos recadrées, sans le texte de l'affiche)
    "lavage-pistes": (1440, 522, [1440, 800]),
    "lavage-entree": (604, 608, [604]),
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
    ("lavage.html", "Lavage"),
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
      <li><a href="lavage.html">Station de lavage</a></li>
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
  <div class="ftr-bottom"><span>© 2026 Winiger Frères Sàrl</span><a href="mentions-legales.html">Mentions légales et confidentialité</a><span class="ftr-credits">Maquette 3D : voiture « <a href="https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept">Car Concept</a> » d'Eric Chadwick, Darmstadt Graphics Group (<a href="https://creativecommons.org/licenses/by/4.0/deed.fr">CC BY 4.0</a>, allégée) ; textures, ciel et housses <a href="https://polyhaven.com">Poly Haven</a> (CC0).</span></div>
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
    home = file == "index.html"
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
<script>document.documentElement.classList.add('js')</script>{ld}''' + ("\n" + XP_HEAD if home else "")
    content = f'''{header(file)}
<main id="main">
{body}
</main>
{footer()}
<script src="assets/js/site.js" defer></script>''' + ("\n" + XP_BODY if home else "")
    if not wrapped:
        # Variante pour l'aperçu Artifact : la page principale est enveloppée par l'hébergeur.
        return head + "\n" + content + "\n"
    return f'''<!doctype html>
<html lang="fr">
<head>
{head}
</head>
<body{' class="home"' if home else ''}>
{content}
</body>
</html>
'''


# ---------------------------------------------------------------- pages


XP_HEAD = '''<link rel="stylesheet" href="assets/css/experience.css">
<script>(function(){var d=document.documentElement,m='3d';
try{m=localStorage.getItem('wfmode')==='off'||localStorage.getItem('wf3d')==='off'?'off':'3d'}catch(e){}
var gl=false;try{var c=document.createElement('canvas');gl=!!(c.getContext('webgl2')||c.getContext('webgl'))}catch(e){}
if(gl)d.classList.add('gl');d.setAttribute('data-mode',m);
if(m==='off'){d.classList.add('im-off');return}
if(m==='3d'&&gl){d.classList.add('im','xp-pending','mode-3d');var l=document.createElement('link');l.rel='modulepreload';l.href='assets/js/experience.js';document.head.appendChild(l);
setTimeout(function(){if(!d.classList.contains('xp-on')){d.classList.remove('im','xp-pending');d.classList.add('xp-failed')}},15000);return}
d.setAttribute('data-mode','off');d.classList.add('im-off')})();</script>'''
XP_BODY = '''<script type="module">if(document.documentElement.classList.contains('mode-3d'))import('./assets/js/experience.js');</script>'''

CHAPTERS = [
    ("accueil", "00", "Accueil"), ("carrosserie", "01", "Carrosserie"), ("gardiennage", "02", "Gardiennage"),
    ("restauration", "03", "Restauration"), ("competition", "04", "Compétition"), ("lavage", "05", "Lavage"),
    ("histoire", "06", "Histoire"), ("realisations", "07", "Réalisations"), ("contact", "08", "Contact"),
]


def ch_photo(name, alt, caption, sizes="(max-width:760px) 100vw, 420px"):
    return f'<figure class="ch-photo">{img(name, alt, sizes)}<figcaption>{caption}</figcaption></figure>'


def ph(name, cap, focus="50% 50%"):
    """Attributs d'une photo réelle affichée en plein écran derrière un bloc de texte (mode photo de l'accueil)."""
    if not name:
        return ' data-ph=""'
    w, h, avail = IMGINFO[name]
    largest = max(avail)
    srcs = ",".join(f"assets/img/{name}-{a}.webp {a}" for a in sorted(avail))
    return f' data-ph="{name}" data-srcs="{srcs}" data-wh="{largest}x{round(h * largest / w)}" data-focus="{focus}" data-cap="{cap}"'


def xsteps(steps):
    n = len(steps)
    out = ""
    for i, st in enumerate(steps):
        title, text, extra = st[:3]
        attrs = st[3] if len(st) > 3 else ""
        out += f'''<div class="ch-step" data-step="{i}"{attrs}><div class="ch-box">
      <p class="step-n"><b>{i+1:02d}</b> / {n:02d}</p>
      <h3>{title}</h3>
      <p>{text}</p>{extra}
    </div></div>'''
    return out


def chapter(id_, num, title, intro, steps, more, photo="", intro_ph=""):
    return f'''
<section class="ch" data-ch="{id_}" id="{id_}" aria-labelledby="h-{id_}">
  <div class="ch-step ch-intro"{intro_ph}><div class="ch-box">
    <p class="ch-n"><span>{num}</span>{dict((c[0], c[2]) for c in CHAPTERS)[id_]}</p>
    <h2 id="h-{id_}">{title}</h2>
    <p class="lead">{intro}</p>
    {photo}
  </div></div>
  {xsteps(steps)}
  <div class="ch-more">{more}</div>
</section>'''



def page_index():
    rail = "".join(f'<a href="#{i}"><span>{n}</span><em>{l}</em></a>' for i, n, l in CHAPTERS)
    spaces = "".join(f'<li><a href="#{i}"><span>{n}</span>{l}</a></li>' for i, n, l in CHAPTERS[1:6])
    hours = "".join(f"<li><span>{d}</span><span>{h}</span></li>" for d, h in HOURS)
    places = {
        "carrosserie": ("Atelier : carrosserie et peinture", "Réparation toutes marques, débosselage, vitrage, peinture en cabine. Atelier agréé Tesla depuis mai 2021."),
        "gardiennage": ("Sous-sol : gardiennage", "Sous-sol chauffé, accès par ascenseur, du mois à l'année."),
        "restauration": ("Restauration", "Caisse sur rotissoire, intérieurs et soubassement repeints en cabine."),
        "competition": ("Compétition", "La Porsche 911 n° 438 court aux couleurs de l'atelier."),
        "lavage": ("Stations de lavage", "Un lavage manuel haute pression et un lavage automatique, paiement par carte ou Twint."),
        "contact": ("Réception", f"{ADDR1}, {ADDR2}. Téléphone {TEL}."),
    }
    place_html = "".join(f'<div data-place="{k}"><h3>{t}</h3><p>{d}</p><a href="#{k}" data-goto>Voir ce chapitre {ARR}</a></div>' for k, (t, d) in places.items())

    carrosserie = chapter("carrosserie", "01", "Carrosserie et peinture, toutes marques.",
        "Du petit choc au sinistre important, jusqu'aux véhicules de prestige. Membre du réseau Tesla Approved Body Shop depuis mai 2021.",
        [
            ("Prise en charge et devis", "Le devis est gratuit. L'atelier peut prendre en charge votre véhicule sur le lieu de votre choix et vous raccompagner à domicile ou au travail.", "", ph("reception-hd", "La réception de l'atelier.", "62% 52%")),
            ("Sinistre et assurance", "L'atelier vous accompagne dans l'annonce et la gestion du sinistre avec votre assurance. Une voiture de remplacement récente peut vous être prêtée.", f'<p class="small">Urgence : WhatsApp <a href="{WA_HREF}" rel="noopener">{WA}</a></p>', ph("tesla-model3", "Tesla Model 3 en réparation : l'atelier est agréé Tesla depuis 2021.", "45% 60%")),
            ("Carrosserie", "Tous travaux de carrosserie, débosselage, remplacement de pare-brise, de lunette arrière et de vitres latérales, remplissage de climatisation.", "", ph("atelier-redressage", "Travail de carrosserie à l'atelier.", "60% 55%")),
            ("Peinture en cabine", "De la retouche à la teinte complète, y compris la peinture mate et la peinture des véhicules anciens.", ch_photo("mazda-giclage", "Peinture au pistolet d'une Mazda dans la cabine de l'atelier", "Photo de l'atelier : peinture d'une Mazda en cabine."), ph("mazda-giclage", "Peinture d'une Mazda en cabine, juillet 2026.", "45% 50%")),
            ("Restitution", "Le véhicule vous est rendu prêt à reprendre la route. Qualité garantie FCR.", "", ph("finition-roue", "Finition, photo de l'atelier.", "60% 55%")),
        ],
        f'<a class="xlink" href="prestations.html">Toutes les prestations {ARR}</a><a class="xlink" href="contact.html#demande-carrosserie">Demander un devis {ARR}</a>', intro_ph=ph("atelier-vue", "L'atelier vu de la mezzanine.", "50% 45%"))

    gardiennage = chapter("gardiennage", "02", "Gardiennage au sous-sol.",
        "Pour les véhicules de collection, de prestige, de sport ou de compétition, quand la place manque ou pour un hivernage.",
        [
            ("Un sous-sol chauffé", "Un espace moderne et sécurisé, réservé au gardiennage des véhicules.", ch_photo("gardiennage", "Voitures sous housse rouge alignées dans le sous-sol de l'atelier", "Photo du sous-sol de gardiennage."), ph("gardiennage", "Le sous-sol de gardiennage : véhicules sous housse.", "40% 60%")),
            ("Accès par ascenseur", "Le véhicule descend au sous-sol par ascenseur, sans rampe à négocier.", "", ph("gardiennage", "Le sous-sol de gardiennage : véhicules sous housse.", "40% 60%")),
            ("Du mois à l'année", "Votre véhicule vous est restitué en parfait état, nettoyé à l'intérieur comme à l'extérieur. Le tarif vous est communiqué sur demande.", "", ph("gardiennage", "Le sous-sol de gardiennage : véhicules sous housse.", "40% 60%")),
        ],
        f'<a class="xlink" href="gardiennage.html">Le gardiennage en détail {ARR}</a><a class="xlink" href="contact.html#demande-gardiennage">Demander une place {ARR}</a>', intro_ph=ph("gardiennage", "Le sous-sol de gardiennage : véhicules sous housse.", "40% 60%"))

    restauration = chapter("restauration", "03", "Restauration, jusqu'aux parties que l'on ne voit pas.",
        "Oldtimers et youngtimers. Dossier en cours depuis août 2026 : une Porsche 911.",
        [
            ("La caisse sur rotissoire", "La caisse est fixée sur une rotissoire : elle pivote pour rendre chaque recoin accessible, dessous compris.", ch_photo("911-rotissoire-cote", "Caisse de Porsche 911 fixée sur une rotissoire à l'atelier", "Photo de l'atelier : la 911 sur sa rotissoire."), ph("911-rotissoire-cote", "Porsche 911 sur sa rotissoire, en cabine.", "50% 55%")),
            ("Le masquage", "Avant la peinture, les zones à protéger sont masquées avec soin.", "", ph("911-masquage", "Masquage de la caisse avant peinture.", "50% 55%")),
            ("Les intérieurs en apprêt", "L'habitacle et les parties intérieures reçoivent leur apprêt en cabine.", "", ph("911-interieur-appret", "L'habitacle de la 911 en apprêt.", "50% 55%")),
            ("Le soubassement", "Grâce à la rotissoire, le soubassement est peint comme le reste de la caisse.", "", ph("911-giclage-soubassement", "Peinture du soubassement, caisse retournée.", "40% 50%")),
        ],
        f'<a class="xlink" href="restauration.html">Suivre le dossier de la 911 {ARR}</a>', intro_ph=ph("911-rotissoire-hero", "Porsche 911 en restauration, dossier en cours depuis août 2026.", "50% 50%"))

    competition = chapter("competition", "04", "Le n° 438 en piste.",
        "Une Porsche 911 court aux couleurs de Winiger Frères, Carrosserie de Grolley. Même exigence de finition qu'à l'atelier.",
        [
            ("La voiture", "Porsche 911, numéro 438, livrée Winiger Frères. Le modèle 3D est une représentation simplifiée, d'après les photos de course.", ch_photo("course-438-profil", "Porsche 911 numéro 438 aux couleurs Winiger Frères en piste", "Photo : Sébastien Montagny / Sport-Auto.ch"), ph("course-438-profil", "Photo : Sébastien Montagny / Sport-Auto.ch", "72% 64%")),
        ],
        f'<a class="xlink" href="competition.html">La page compétition {ARR}</a>', intro_ph=ph("course-438-face", "Photo : Sébastien Montagny / Sport-Auto.ch", "55% 55%"))

    lavage = chapter("lavage", "05", "Station de lavage, chez les Frères Winiger.",
        "À deux pas de la carrosserie, à Grolley : un lavage manuel haute pression et un lavage automatique.",
        [
            ("Lavage manuel haute pression", "Une station de lavage manuel haute pression, sous auvent, en face de la carrosserie.", "", ph("lavage-pistes", "Le lavage manuel haute pression. Photo publiée par l'atelier le 22 août 2026.", "62% 50%")),
            ("Lavage automatique", "Une station de lavage automatique, dans un local fermé au bout du bâtiment voisin : on entre côté cour et on ressort tout droit de l'autre côté.", "", ph("lavage-entree", "Le lavage automatique. Photo publiée par l'atelier le 22 août 2026.", "50% 50%")),
            ("Carte ou Twint", f"Les deux stations acceptent le paiement électronique. Horaires et tarifs : renseignez-vous auprès de l'atelier au <a href=\"{TEL_HREF}\">{TEL}</a>.", '<p class="small muted">Sources : publication de l\'atelier du 22 août 2026 et indications de l\'atelier (novembre 2026).</p>', ph("lavage-pistes", "Les pistes de lavage haute pression. Photo publiée par l'atelier le 22 août 2026.", "62% 50%")),
        ],
        f'<a class="xlink" href="lavage.html">La station de lavage {ARR}</a>', intro_ph=ph("lavage-pistes", "La station de lavage, à côté de la carrosserie. Photo publiée par l'atelier le 22 août 2026.", "62% 50%"))

    histoire = chapter("histoire", "06", "Deux frères, un atelier qui grandit.",
        "Une carrosserie familiale, fondée et dirigée par Richard et Fabrice Winiger, membre de carrosserie suisse et entreprise formatrice.",
        [
            ("2004", "Richard et Fabrice Winiger fondent la carrosserie à Grolley.", ch_photo("atelier-equipe", "L'équipe de Winiger Frères réunie dans l'atelier", "Photo de l'équipe à l'atelier."), ph("batiment-enseigne", "L'enseigne de la carrosserie.", "42% 40%")),
            ("2021", "En mai, l'atelier rejoint le réseau Tesla Approved Body Shop.", "", ph("tesla-model3", "Tesla Model 3 en réparation à l'atelier.", "45% 60%")),
            ("2026", "Agrandissement du bâtiment, avec une nouvelle réception et un showroom. La charpente est en cours de montage ; sa position dans la maquette est indicative.", "", ph("batiment-cote", "Le bâtiment avant l'agrandissement (photo publiée en 2021).", "55% 55%")),
        ],
        f'<a class="xlink" href="entreprise.html">L\'entreprise {ARR}</a>', intro_ph=ph("atelier-equipe", "L'équipe à l'atelier.", "50% 50%"))

    works = [
        ("huracan-bouclier", "Lamborghini Huracán", "Bloc avant, janvier 2026", "Bouclier avant de la Lamborghini Huracán en préparation sur chevalet"),
        ("mazda-giclage", "Mazda", "Peinture en cabine, juillet 2026", "Peinture d'une Mazda au pistolet en cabine"),
        ("911-soubassement-fini", "Porsche 911", "Soubassement repeint, 2026", "Soubassement de la Porsche 911 entièrement repeint"),
        ("tesla-model3", "Tesla Model 3", "Réparation, atelier agréé Tesla", "Tesla Model 3 en réparation à l'atelier"),
        ("993-livraison", "Porsche 993", "Remise en état, livrée en février 2023", "Porsche 993 jaune livrée après remise en état"),
        ("pieces-cabine", "Préparation", "Pièces prêtes pour la cabine", "Pièces de carrosserie préparées avant peinture dans la cabine"),
        ("restauration-remorque", "Restauration", "Départ chez son propriétaire, décembre 2020", "Véhicule restauré chargé sur une remorque au départ de l'atelier"),
        ("huracan-avant", "Lamborghini Huracán", "Bloc avant démonté", "Lamborghini Huracán, bloc avant démonté à l'atelier"),
    ]
    track = "".join(f'<li><figure>{img(k, a, "(max-width:760px) 78vw, 30vw")}<figcaption><span>{i+1:02d}</span><b>{t}</b>{d}</figcaption></figure></li>' for i, (k, t, d, a) in enumerate(works))

    return f'''
<div class="ph-stage" id="ph-stage" aria-hidden="true">
  <div class="ph-layers"></div>
  <div class="ph-empty"><p><b>Station de lavage</b>Photo à venir. Les pistes haute pression, sous auvent à cadres rouges, figurent sur la publication de l'atelier du 22 août 2026.</p></div>
  <p class="ph-cap"><span></span></p>
</div>
<div class="xp-stage" id="xp-stage" data-logo="assets/img/logo-winiger-960.webp">
  <canvas id="xp-canvas" role="img" aria-label="Maquette 3D interactive du bâtiment de la carrosserie Winiger Frères : atelier, cabine de peinture, sous-sol de gardiennage, restauration, voiture de course n° 438 et station de lavage."></canvas>
  <div class="xp-veil" aria-hidden="true"></div>
  <div class="xp-pins" id="xp-pins"></div>
  <p class="xp-loader" aria-hidden="true"><span></span>Chargement de la maquette 3D</p>
  <p class="xp-badge">Maquette 3D conceptuelle · disposition intérieure indicative</p>
  <div class="xp-explore-ui">
    <p>Glisser : tourner · Molette ou pincement : zoomer · Clic droit ou deux doigts : déplacer · Repères : aller à un espace</p>
    <button class="xbtn xbtn-dark" type="button" id="xp-exit">Quitter l'exploration</button>
  </div>
  <aside class="xp-info" id="xp-info" hidden aria-live="polite"></aside>
</div>
<div hidden>{place_html}</div>
<nav class="xp-rail" id="xp-rail" aria-label="Chapitres de la page">{rail}</nav>

<section class="ch ch-hero" data-ch="hero" id="accueil" aria-labelledby="h-hero">
  <div class="ch-step ch-intro"{ph("batiment-facade", "Le bâtiment de l'atelier à Grolley (photo publiée en 2021, avant l'agrandissement).", "62% 52%")}><div class="ch-box">
    <p class="kicker">Winiger Frères · Carrosserie de Grolley · depuis 2004</p>
    <h1 id="h-hero">Carrosserie, peinture, restauration et gardiennage.</h1>
    <p class="lead">Un atelier familial à Grolley, pour les voitures de tous les jours comme pour les véhicules de prestige et de collection.</p>
    <div class="xbtns">
      <button class="xbtn xbtn-dark xp-only" type="button" id="xp-explore">Explorer le bâtiment en 3D</button>
      <a class="xbtn xbtn-red" href="contact.html#demande">Demander un devis</a>
      <a class="xbtn xbtn-line" href="{TEL_HREF}">{TEL}</a>
    </div>
    <ul class="spaces" aria-label="Les espaces de l'atelier">{spaces}</ul>
    <p class="hint m3d-only">Faites défiler : le bâtiment s'ouvre espace par espace. Faites glisser pour tourner, cliquez sur un espace pour y aller.</p>
    <p class="hint ph-only">Faites défiler : l'atelier, espace par espace, en photos réelles.</p>
    <p class="note">Toutes les photos sont réelles, prises à l'atelier ou en course. La maquette 3D du bâtiment est une représentation conceptuelle : volumes d'après les photos publiques, aménagement intérieur indicatif.</p>
    <p class="modes" role="group" aria-label="Affichage de la page d'accueil">Affichage :
      <button class="tlink gl-only" type="button" data-setmode="3d">Maquette 3D</button>
      <button class="tlink" type="button" data-setmode="off">Sans animation</button></p>
    {ch_photo("atelier-peintre", "Carrossier au travail dans l'atelier Winiger Frères", "Photo de l'atelier.", "(max-width:760px) 100vw, 60vw")}
  </div></div>
</section>
{carrosserie}
{gardiennage}
{restauration}
{competition}
{lavage}
{histoire}

<section class="ch ch-real" data-ch="realisations" id="realisations" aria-labelledby="h-real">
  <div class="real-sticky">
    <div class="real-head">
      <p class="ch-n"><span>07</span>Réalisations</p>
      <h2 id="h-real">Sorties d'atelier.</h2>
      <p>Photos réelles de travaux récents. <a class="xlink" href="{INSTA}" rel="noopener">Toutes les nouvelles sur Instagram {ARR}</a></p>
    </div>
    <ol class="real-track">{track}</ol>
  </div>
</section>

<section class="ch ch-contact" data-ch="contact" id="contact" aria-labelledby="h-contact">
  <div class="ch-step ch-intro"{ph("batiment-entree", "L'entrée de l'atelier, à Grolley.", "45% 60%")}><div class="ch-box ch-box-wide">
    <p class="ch-n"><span>08</span>Contact</p>
    <h2 id="h-contact">Passez à l'atelier.</h2>
    <div class="contact-cols">
      <div>
        <p class="lbl">Téléphone</p><p><a class="big" href="{TEL_HREF}">{TEL}</a></p>
        <p class="lbl">Urgence sinistre (WhatsApp)</p><p><a href="{WA_HREF}" rel="noopener">{WA}</a></p>
        <p class="lbl">E-mail</p><p><a href="mailto:{MAIL}">{MAIL}</a></p>
      </div>
      <div>
        <p class="lbl">Adresse</p><p>Winiger Frères Sàrl<br>{ADDR1}<br>{ADDR2}</p>
        <p class="lbl">Horaires</p><ul class="hours">{hours}</ul>
      </div>
    </div>
    <div class="xbtns"><a class="xbtn xbtn-red" href="contact.html#demande">Demander un devis</a><a class="xbtn xbtn-line" href="{MAPS}" rel="noopener">Itinéraire</a></div>
    {ch_photo("reception", "Réception de l'atelier Winiger Frères, comptoir gris et rouge", "Photo de la réception.")}
  </div></div>
</section>'''



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


def page_lavage():
    return page_head("Station de lavage", "Station de lavage", "Station lavage, <span class=\"accent\">chez les Frères Winiger.</span>",
        "À deux pas de la carrosserie, à Grolley : un lavage manuel haute pression et un lavage automatique, avec paiement par carte ou Twint.",
        f'<div class="btns"><a class="btn btn-ghost" href="{TEL_HREF}"><span>{TEL}</span></a><a class="btn btn-ghost" href="{MAPS}" rel="noopener"><span>Itinéraire {ARR}</span></a></div>', image="lavage-entree", pos="50% 45%", alt="Entrée de la station de lavage, enseigne « Station Lavage, chez les Frères Winiger »") + f'''
<section class="section wrap" aria-labelledby="h-lav">
  <div class="inner split" style="align-items:start">
    <div class="stack">
      <p class="eyebrow">Ce que vous trouvez</p>
      <h2 class="display h2" id="h-lav">Manuel ou <span class="accent">automatique.</span></h2>
      <ul class="checks">
        <li>Lavage manuel haute pression, sous auvent</li>
        <li>Lavage automatique, en local fermé</li>
        <li>Paiement électronique : carte ou Twint</li>
        <li>Sur le site de la carrosserie, {ADDR1}, {ADDR2}</li>
      </ul>
    </div>
    <div class="stack">
      <p class="eyebrow">À savoir</p>
      <p class="lead">Les horaires, les tarifs et les programmes de lavage ne sont pas encore publiés en ligne. Pour toute question, appelez l'atelier au <a href="{TEL_HREF}">{TEL}</a>.</p>
      <p class="muted small">Sources : publication de l'atelier du 22 août 2026 annonçant le paiement électronique, et indications de l'atelier (novembre 2026).</p>
    </div>
  </div>
</section>''' + cta_band("Une carrosserie à refaire ?", "Après le lavage, l'atelier est juste à côté.", "contact.html#demande", "Demander un devis")


PAGES = [
    ("index.html", "Winiger Frères | Carrosserie, restauration et gardiennage à Grolley",
     "Carrosserie toutes marques, peinture en cabine, restauration, gardiennage en sous-sol chauffé et station de lavage à Grolley (FR). Explorez l\'atelier en 3D.", page_index, True),
    ("prestations.html", "Prestations de carrosserie et peinture | Winiger Frères, Grolley",
     "Réparation toutes marques, débosselage, peinture en cabine et finition mate, réparation Tesla, sinistres et vitrage à Grolley. Devis gratuit.", page_prestations, False),
    ("restauration.html", "Restauration de véhicules anciens | Winiger Frères",
     "Restauration d'oldtimers et youngtimers à Grolley : caisse sur rotissoire, peinture des intérieurs en cabine. Suivez le dossier d'une Porsche 911.", page_restauration, False),
    ("gardiennage.html", "Gardiennage de voitures de sport et de collection | Winiger Frères",
     "Gardiennage de voitures de sport et de collection en sous-sol chauffé, accès par ascenseur, du mois à l'année, à Grolley.", page_gardiennage, False),
    ("lavage.html", "Station de lavage haute pression | Winiger Frères, Grolley",
     "Lavage manuel haute pression et lavage automatique chez les Frères Winiger à Grolley, paiement par carte ou Twint.", page_lavage, False),
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
