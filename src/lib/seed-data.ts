import { Contact, AudienceType } from './types';

// Seed contacts pre-loaded from the PRD
export const SEED_CONTACTS: Omit<Contact, 'id' | 'createdAt'>[] = [
  // ===== CORPORATIF =====
  {
    fullName: 'Isabelle Lajoie',
    organization: 'Hydro-Québec',
    title: 'Conseillère, Communication interne',
    linkedinUrl: 'https://linkedin.com/in/isabellelajoie',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Ève Giard',
    organization: 'CDPQ',
    title: '1ère VP Talent et Performance',
    linkedinUrl: 'https://linkedin.com/in/eve-giard-3b2417129',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Lucie Houle',
    organization: 'Banque Nationale',
    title: 'VP Culture et Talent',
    linkedinUrl: 'https://linkedin.com/in/luciehoule',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Charles Bernardi',
    organization: 'Desjardins',
    title: 'Leader de pratique ESG',
    linkedinUrl: 'https://linkedin.com/in/charles-bernardi-09a60278',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Philippe Carrier',
    organization: 'Bell Canada',
    title: 'Directeur Communications',
    linkedinUrl: 'https://linkedin.com/in/philippecarrier',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Ève Laurier',
    organization: 'Bombardier',
    title: 'VP Communications et Marketing',
    linkedinUrl: 'https://linkedin.com/in/evelaurier',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Marie Lemire',
    organization: 'WSP Global',
    title: 'Manager, Internal Communications',
    linkedinUrl: 'https://linkedin.com/in/marielemirecomm',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Katerina Pettas',
    organization: 'Saputo',
    title: 'Sr Manager, Communications',
    linkedinUrl: 'https://linkedin.com/in/katerinapettas',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Mandy Dennison',
    organization: 'Intact',
    title: 'VP Social Impact & ESG',
    linkedinUrl: 'https://linkedin.com/in/mandydennison',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },
  {
    fullName: 'Jordan Prieur',
    organization: 'Lightspeed',
    title: 'Sr Manager, Talent Acquisition',
    linkedinUrl: 'https://linkedin.com/in/jordanhprieur',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'corporatif',
  },

  // ===== ÉCOLES =====
  {
    fullName: 'Isabelle Gélinas',
    organization: 'CSSDM',
    title: 'Directrice générale',
    linkedinUrl: 'https://linkedin.com/in/isabelle-gelinas',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },
  {
    fullName: 'Stéphanie Lapointe',
    organization: 'CSS Marguerite-Bourgeoys',
    title: 'Dir. ressources éducatives',
    linkedinUrl: 'https://linkedin.com/in/stéphanie-lapointe-a9163ab2',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },
  {
    fullName: 'Natalie Lacombe',
    organization: 'Cégep de Maisonneuve',
    title: 'Dir. adjointe des études',
    linkedinUrl: 'https://linkedin.com/in/natalie-lacombe-462040235',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },
  {
    fullName: 'Camille Grange',
    organization: 'HEC Montréal',
    title: 'Dir. Transition durable',
    linkedinUrl: 'https://linkedin.com/in/cgrange',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },
  {
    fullName: 'Peter Garber',
    organization: 'McGill',
    title: 'Sustainability Officer',
    email: 'peter.garber@mcgill.ca',
    channel: 'email',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },
  {
    fullName: 'Rebecca Black',
    organization: 'Concordia',
    title: 'Sustainability Outreach Coordinator',
    linkedinUrl: 'https://linkedin.com/in/rebecca-black-371021134',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },
  {
    fullName: 'Jacqueline Wallace',
    organization: 'Polytechnique Montréal',
    title: 'Dir. Communications',
    linkedinUrl: 'https://linkedin.com/in/jacquelinewallace',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },
  {
    fullName: 'Alain Turcotte',
    organization: 'Collège Jean-de-Brébeuf',
    title: 'Dir. vie étudiante',
    linkedinUrl: 'https://linkedin.com/in/alain-turcotte-616a63a0',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'ecoles',
  },

  // ===== INSTITUTIONS & MÉDIAS =====
  {
    fullName: 'Andréanne Paquet',
    organization: 'Tourisme Montréal',
    title: 'Dir. Développement des affaires',
    linkedinUrl: 'https://linkedin.com/in/aapaquet',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  {
    fullName: 'Élise Tastet',
    organization: 'Tastet',
    title: 'Fondatrice et PDG',
    email: 'elise@tastet.ca',
    channel: 'email',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  {
    fullName: 'Ariane Desrochers',
    organization: 'La Terre de Chez Nous',
    title: 'Rédactrice en chef',
    email: 'ariane.desrochers@laterre.ca',
    channel: 'email',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  {
    fullName: 'Olivier Robichaud',
    organization: 'Journal Métro',
    title: 'Rédacteur en chef',
    linkedinUrl: 'https://linkedin.com/in/olivier-robichaud-a098b626',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  {
    fullName: 'Bernard Barbeau',
    organization: 'Radio-Canada',
    title: 'Journaliste chef de pupitre',
    linkedinUrl: 'https://linkedin.com/in/bernardbarbeau',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  {
    fullName: 'Marie-Pier Frappier',
    organization: 'Les Affaires',
    title: 'Rédactrice en chef',
    linkedinUrl: 'https://linkedin.com/in/marie-pier-frappier-13a53b144',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  {
    fullName: 'Odette Chaput',
    organization: 'Terroir et Saveurs',
    title: 'Dir. générale',
    email: 'ochaput@terroiretsaveurs.com',
    channel: 'email',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  {
    fullName: 'Marie-Lise Campeau',
    organization: 'Sid Lee Montréal',
    title: 'PDG',
    channel: 'linkedin',
    status: 'a_contacter',
    audienceType: 'institutions',
  },
  // Confirmed partners
  {
    fullName: 'Sidney Ribaux',
    organization: 'Ville de Montréal – Bureau de la transition écologique',
    title: 'Directeur',
    channel: 'email',
    status: 'confirme',
    audienceType: 'institutions',
    notes: 'Partenaire existant',
  },
  {
    fullName: 'Gilbert Samaha',
    organization: 'PME-MTL',
    title: 'Directeur',
    channel: 'email',
    status: 'confirme',
    audienceType: 'institutions',
    notes: 'Partenaire existant',
  },
];

export const DEFAULT_TEMPLATES: Record<AudienceType, { subject: string; body: string }> = {
  corporatif: {
    subject: 'Visite privée – La Centrale Agricole, la plus grande coopérative d\'agriculture urbaine au monde',
    body: `Bonjour [Prénom],

Je me permets de vous écrire au sujet d'une visite de groupe que nous croyons très pertinente pour votre équipe.

La Centrale Agricole est la plus grande coopérative d'agriculture urbaine au monde : 20 entreprises réunies sous un même toit de 17 000 m² à Montréal, fonctionnant en économie circulaire. Vos employés plongeront dans le quotidien d'entrepreneur·e·s passionné·e·s qui produisent du cidre, du vin, des champignons, des légumes-feuilles et des fleurs sur les toits, élèvent insectes et poissons, distribuent des plantes exotiques, revalorisent des fruits et légumes, et développent des circuits courts entre producteurs et consommateurs urbains.

Nos visites guidées privées durent entre 1h30 et 2h et comprennent un accueil et une présentation, la rencontre avec 1 à 3 membres selon vos intérêts, et la découverte des installations partagées : toit cultivé, composteur, chambre froide, cuisines collectives, et plus encore. Une dégustation de produits des membres peut également être ajoutée selon votre budget.

Tarif : 450 $ + taxes pour un groupe de 20 personnes maximum (22,50 $ + taxes par personne supplémentaire).

Seriez-vous disponible pour un bref échange cette semaine afin de voir si ça correspond à vos besoins ?

Nora Azouz
Responsable communications et événements
La Centrale Agricole | nora@centrale.coop | centrale.coop`,
  },
  ecoles: {
    subject: 'Visite éducative – La Centrale Agricole, agriculture urbaine et économie circulaire',
    body: `Bonjour [Prénom],

Je vous contacte pour vous présenter une visite éducative que nous croyons bien adaptée à votre programme.

La Centrale Agricole est la plus grande coopérative d'agriculture urbaine au monde, située à Montréal : 20 entreprises réunies sous un même toit, fonctionnant en économie circulaire. Vos élèves ou étudiants peuvent y découvrir concrètement la production de cidre, de champignons, de légumes-feuilles, l'élevage d'insectes et de poissons, la revalorisation alimentaire, les circuits courts — avec des échanges directs avec les entrepreneur·e·s sur place.

Nos visites guidées durent entre 1h30 et 2h et sont adaptées aux objectifs du groupe. Elles comprennent un accueil, la rencontre de 1 à 3 membres, et la découverte des installations partagées (toit cultivé, composteur, chambre froide, cuisines collectives). Une dégustation peut aussi être ajoutée.

Tarif pour groupes scolaires ou OBNL : 300 $ + taxes (jusqu'à 20 personnes), 15 $ + taxes par personne supplémentaire.

Seriez-vous disponible pour un court échange afin de voir si une visite pourrait s'intégrer à votre calendrier ?

Nora Azouz
Responsable communications et événements
La Centrale Agricole | nora@centrale.coop | centrale.coop`,
  },
  institutions: {
    subject: 'Partenariat – La Centrale Agricole, un lieu unique à découvrir',
    body: `Bonjour [Prénom],

Je vous contacte pour explorer une opportunité de collaboration avec La Centrale Agricole.

La Centrale est la plus grande coopérative d'agriculture urbaine au monde, située dans un bâtiment de 17 000 m² à Montréal. On y retrouve 20 entreprises qui produisent du cidre, du vin, des champignons, des légumes-feuilles et des fleurs sur les toits, élèvent insectes et poissons, distribuent des plantes exotiques, revalorisent des fruits et légumes, et développent des circuits courts — le tout en économie circulaire.

Nous accueillons des groupes pour des visites guidées immersives de 1h30 à 2h — entreprises, écoles, institutions, délégations — avec rencontre des membres et découverte des installations : toit cultivé, composteur, chambre froide, cuisines collectives.

Nous aimerions discuter de comment La Centrale pourrait s'intégrer à votre offre ou à vos recommandations.

Je serais ravie de vous organiser une visite des installations à votre convenance.

Nora Azouz
Responsable communications et événements
La Centrale Agricole | nora@centrale.coop | centrale.coop`,
  },
};
