// Données commerciales — uniquement des informations vérifiées.
// Sources consultées le 21.11.2026 : winiger-artcar.ch (toutes pages), fiche local.ch,
// page Facebook officielle. Toute donnée non confirmée est marquée `todo`.

export const SITE_URL = 'https://www.winiger-artcar.ch';

export const company = {
  name: 'Winiger Frères Sàrl',
  tagline: 'Carrosserie de Grolley',
  founded: 2004,
  founders: [
    { first: 'Richard', last: 'Winiger', mobile: '079 418 86 09', mobileHref: '+41794188609' },
    { first: 'Fabrice', last: 'Winiger', mobile: '079 457 00 37', mobileHref: '+41794570037' },
  ],
  street: "Route de l'Industrie-Ouest 11",
  zip: '1772',
  city: 'Grolley',
  canton: 'Fribourg',
  country: 'CH',
  phone: '026 476 06 06',
  phoneHref: '+41264760606',
  fax: '026 476 06 07',
  email: 'carrosserie@winiger-artcar.ch',
  facebook: 'https://www.facebook.com/carrosseriewinigersarl/',
  instagram: 'https://www.instagram.com/carrosserie_winiger_freres_/',
  mapsQuery: "Winiger Frères Sàrl, Route de l'Industrie-Ouest 11, 1772 Grolley",
};

export const mapsLink = (q: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
export const appleMapsLink = (q: string) =>
  `https://maps.apple.com/?daddr=${encodeURIComponent(q)}`;

// Horaires de l'atelier (site officiel + local.ch)
export const hours = [
  { days: 'Lundi — Jeudi', slots: ['07:00 – 12:00', '13:30 – 18:00'] },
  { days: 'Vendredi', slots: ['07:00 – 13:30 non-stop'] },
  { days: 'Samedi', slots: ['Sur rendez-vous, 08:00 – 12:00'] },
  { days: 'Dimanche', slots: ['Fermé'] },
];

export const urgent =
  "En cas d'extrême urgence, un message WhatsApp peut être envoyé à Fabrice ou Richard Winiger.";

export const certifications = [
  { name: 'TESLA Approved Body Shop', detail: 'Membre du réseau depuis mai 2021', href: 'https://www.tesla.com/fr_ch/support/body-shop-support' },
  { name: 'Repanet Suisse', detail: 'Réseau de carrosseries certifiées', href: 'https://repanetsuisse.ch/fr/home/' },
  { name: 'Carrosserie Suisse', detail: 'Qualité garantie FCR', href: 'https://www.carrosseriesuisse.ch/fr/' },
];

// Liste publiée sur la page « Assurances » du site officiel
export const insurers = ['Alphera', 'Allianz', 'Zurich', 'AXA', 'Helvetia', 'Smile', 'Mobilière (pare-brise)', 'Fenaco'];

// Marques citées sur le site officiel (« Notre carrosserie répare régulièrement… »).
// Il s'agit de véhicules réparés, pas de partenariats.
export const prestigeBrands = ['Ferrari', 'Aston Martin', 'Maserati', 'Bentley', 'Porsche', 'Lamborghini'];

export const storage = {
  intro:
    "Un sous-sol chauffé, accessible par ascenseur, doté d'infrastructures modernes et sécurisées, spécialement réservé au gardiennage des véhicules.",
  duration: "D'un mois à une année",
  returnState: 'Véhicule restitué en parfait état, nettoyé intérieur et extérieur.',
  rates: [
    { label: 'Tarif mensuel', price: "CHF 200.–", unit: 'par mois', note: 'Pour une durée de 1 à 3 mois' },
    { label: "Tarif d'hivernage", price: "CHF 1'000.–", unit: '6 mois', note: 'Pour une durée totale de 6 mois' },
    { label: 'Tarif annuel', price: "CHF 2'500.–", unit: 'par an', note: 'Gardiennage sur 12 mois' },
  ],
};

// Station de lavage — seules deux informations sont confirmées publiquement :
// 1) « Tunnel de lavage dernière génération, pour un lavage soigneux et efficace » (affiche officielle + local.ch)
// 2) adresse indiquée sur local.ch : Rte de l'Industrie-Ouest 7, 1772 Grolley
// Le prix « dès 10.– » figure sur l'affiche de lancement (2021) : à reconfirmer.
export const wash = {
  type: 'Tunnel de lavage dernière génération',
  promise: 'Pour un lavage soigneux et efficace.',
  street: "Route de l'Industrie-Ouest 7",
  mapsQuery: "Route de l'Industrie-Ouest 7, 1772 Grolley",
  priceFrom: 'dès CHF 10.–',
  priceSource: "Tarif d'appel indiqué sur l'affiche de lancement — à confirmer",
};

export const nav = [
  { href: '/entreprise/', label: "L'entreprise", short: 'Entreprise', sector: '01' },
  { href: '/carrosserie/', label: 'Carrosserie & services', short: 'Carrosserie', sector: '02' },
  { href: '/prestige-collection/', label: 'Prestige & collection', short: 'Prestige', sector: '03' },
  { href: '/gardiennage/', label: 'Gardiennage', short: 'Gardiennage', sector: '04' },
  { href: '/station-de-lavage/', label: 'Station de lavage', short: 'Lavage', sector: '05' },
  { href: '/locaux/', label: 'Locaux & réalisations', short: 'Locaux', sector: '06' },
  { href: '/contact/', label: 'Contact', short: 'Contact', sector: '07' },
];

// Prestations de carrosserie — toutes issues du site officiel ou de la fiche local.ch
export const services = [
  { id: 'reparation', code: 'C01', title: 'Réparation toutes marques',
    text: "Personnel constamment formé aux exigences de toutes les marques. Accompagnement dans l'annonce et la gestion des sinistres.",
    img: 'atelier-6194' },
  { id: 'carrosserie', code: 'C02', title: 'Tous travaux de carrosserie',
    text: "Tôlerie, redressage, remplacement d'éléments, avec un outillage de dernière génération.",
    img: 'atelier-9880' },
  { id: 'debosselage', code: 'C03', title: 'Débosselage',
    text: 'Remise en forme des éléments de carrosserie déformés.',
    img: null, ph: 'Débosselage d’un panneau de carrosserie, gros plan.' },
  { id: 'peinture', code: 'C04', title: 'Peinture & finition',
    text: 'Peinture au four, finitions mates et peinture de véhicules anciens, travaillées dans les règles de l’art.',
    img: 'atelier-6314' },
  { id: 'vitrages', code: 'C05', title: 'Vitrages',
    text: 'Réparation et remplacement de pare-brise, lunettes arrière et vitres latérales. Teintage de vitres.',
    img: null, ph: 'Remplacement d’un pare-brise à l’atelier.' },
  { id: 'remplacement', code: 'C06', title: 'Véhicules de remplacement',
    text: 'Des voitures de remplacement récentes pendant la durée des travaux.',
    img: 'ext-6177' },
  { id: 'complementaires', code: 'C07', title: 'Prestations complémentaires',
    text: 'Remplissage de climatisation et conseils personnalisés. Prise en charge du véhicule sur le lieu de votre choix, accompagnement à domicile ou au travail et devis : gratuits.',
    img: 'reception-9997' },
] as { id: string; code: string; title: string; text: string; img: string | null; ph?: string }[];
