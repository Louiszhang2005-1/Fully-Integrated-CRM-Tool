import { Contact, AudienceType } from './types';

export const SEED_VERSION = 'v2';

// Helpers for realistic sentAt dates spread across April 2026
const d = (day: number) => new Date(2026, 3, day, 9, 30).toISOString(); // April 2026

// Seed contacts pre-loaded from the PRD
export const SEED_CONTACTS: Omit<Contact, 'id' | 'createdAt'>[] = [
  // ===== CORPORATIF =====
  {
    fullName: 'Isabelle Lajoie',
    organization: 'Hydro-Québec',
    title: 'Conseillère, Communication interne',
    linkedinUrl: 'https://linkedin.com/in/isabellelajoie',
    channel: 'linkedin',
    status: 'en_discussion',
    audienceType: 'corporatif',
    sentAt: d(1),
    lastAction: 'Responded positively, interested in a visit in May',
  },
  {
    fullName: 'Ève Giard',
    organization: 'CDPQ',
    title: '1ère VP Talent et Performance',
    linkedinUrl: 'https://linkedin.com/in/eve-giard-3b2417129',
    channel: 'linkedin',
    status: 'envoye',
    audienceType: 'corporatif',
    sentAt: d(2),
  },
  {
    fullName: 'Lucie Houle',
    organization: 'Banque Nationale',
    title: 'VP Culture et Talent',
    linkedinUrl: 'https://linkedin.com/in/luciehoule',
    channel: 'linkedin',
    status: 'confirme',
    audienceType: 'corporatif',
    sentAt: d(1),
    lastAction: 'Visit confirmed for April 18, group of 22 people',
  },
  {
    fullName: 'Charles Bernardi',
    organization: 'Desjardins',
    title: 'Leader de pratique ESG',
    linkedinUrl: 'https://linkedin.com/in/charles-bernardi-09a60278',
    email: 'c.bernardi@desjardins.com',
    channel: 'email',
    status: 'envoye',
    audienceType: 'corporatif',
    sentAt: d(3),
  },
  {
    fullName: 'Philippe Carrier',
    organization: 'Bell Canada',
    title: 'Directeur Communications',
    linkedinUrl: 'https://linkedin.com/in/philippecarrier',
    channel: 'linkedin',
    status: 'envoye',
    audienceType: 'corporatif',
    sentAt: d(3),
  },
  {
    fullName: 'Ève Laurier',
    organization: 'Bombardier',
    title: 'VP Communications et Marketing',
    email: 'e.laurier@bombardier.com',
    channel: 'email',
    status: 'en_discussion',
    audienceType: 'corporatif',
    sentAt: d(2),
    lastAction: 'Requested pricing information for a group of 30',
  },
  {
    fullName: 'Marie Lemire',
    organization: 'WSP Global',
    title: 'Manager, Internal Communications',
    linkedinUrl: 'https://linkedin.com/in/marielemirecomm',
    email: 'm.lemire@wsp.com',
    channel: 'email',
    status: 'envoye',
    audienceType: 'corporatif',
    sentAt: d(4),
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
    status: 'envoye',
    audienceType: 'ecoles',
    sentAt: d(5),
  },
  {
    fullName: 'Stéphanie Lapointe',
    organization: 'CSS Marguerite-Bourgeoys',
    title: 'Dir. ressources éducatives',
    linkedinUrl: 'https://linkedin.com/in/stéphanie-lapointe-a9163ab2',
    channel: 'linkedin',
    status: 'en_discussion',
    audienceType: 'ecoles',
    sentAt: d(4),
    lastAction: 'Wants to schedule a visit for 35 grade 10 students',
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
    email: 'c.grange@hec.ca',
    channel: 'email',
    status: 'confirme',
    audienceType: 'ecoles',
    sentAt: d(2),
    lastAction: 'Visit confirmed for group of 28 MBA students, April 25',
  },
  {
    fullName: 'Peter Garber',
    organization: 'McGill',
    title: 'Sustainability Officer',
    email: 'peter.garber@mcgill.ca',
    channel: 'email',
    status: 'envoye',
    audienceType: 'ecoles',
    sentAt: d(5),
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
    status: 'envoye',
    audienceType: 'institutions',
    sentAt: d(6),
  },
  {
    fullName: 'Élise Tastet',
    organization: 'Tastet',
    title: 'Fondatrice et PDG',
    email: 'elise@tastet.ca',
    channel: 'email',
    status: 'en_discussion',
    audienceType: 'institutions',
    sentAt: d(3),
    lastAction: 'Interested in an article about Mon Organisation, requesting more details',
  },
  {
    fullName: 'Ariane Desrochers',
    organization: 'La Terre de Chez Nous',
    title: 'Rédactrice en chef',
    email: 'ariane.desrochers@laterre.ca',
    channel: 'email',
    status: 'envoye',
    audienceType: 'institutions',
    sentAt: d(6),
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
    sentAt: d(1),
    notes: 'Existing partner — delegation visit confirmed for April 10',
  },
  {
    fullName: 'Gilbert Samaha',
    organization: 'PME-MTL',
    title: 'Directeur',
    channel: 'email',
    status: 'confirme',
    audienceType: 'institutions',
    sentAt: d(2),
    notes: 'Existing partner',
  },
];

export const DEFAULT_TEMPLATES: Record<AudienceType, { subject: string; body: string }> = {
  corporatif: {
    subject: 'Private Group Visit – Mon Organisation, the World\'s Largest Urban Agriculture Cooperative',
    body: `Hello [FirstName],

I am reaching out about a group visit experience we believe would be highly relevant for your team.

Mon Organisation is the world's largest urban agriculture cooperative: 20 businesses under one 17,000 m² roof in Montreal, operating in a circular economy. Your employees will immerse themselves in the daily life of passionate entrepreneurs producing cider, wine, mushrooms, leafy greens and rooftop flowers, raising insects and fish, distributing exotic plants, repurposing surplus produce, and building short supply chains between urban producers and consumers.

Our private guided tours last 1.5 to 2 hours and include a welcome presentation, meetings with 1 to 3 member businesses based on your interests, and a tour of shared facilities: rooftop farm, composter, cold room, shared kitchens, and more. A tasting of member products can also be added depending on your budget.

Pricing: $450 + tax for a group of up to 20 people ($22.50 + tax per additional person).

Would you be available for a brief call this week to see if this fits your needs?

Nora Azouz
Communications & Events Manager
Mon Organisation | contact@monorganisation.com | monorganisation.com`,
  },
  ecoles: {
    subject: 'Educational Visit – Mon Organisation, Urban Agriculture and Circular Economy',
    body: `Hello [FirstName],

I am reaching out to present an educational visit we believe would be a great fit for your program.

Mon Organisation is the world's largest urban agriculture cooperative, located in Montreal: 20 businesses under one roof, operating in a circular economy. Your students can discover firsthand the production of cider, mushrooms, and leafy greens, insect and fish farming, food repurposing, short supply chains — with direct exchanges with the entrepreneurs on site.

Our guided tours last 1.5 to 2 hours and are tailored to your group's learning objectives. They include a welcome, meetings with 1 to 3 member businesses, and a tour of shared facilities (rooftop farm, composter, cold room, shared kitchens). A tasting can also be added.

Pricing for school or non-profit groups: $300 + tax (up to 20 people), $15 + tax per additional person.

Would you be available for a brief call to see if a visit could fit into your calendar?

Nora Azouz
Communications & Events Manager
Mon Organisation | contact@monorganisation.com | monorganisation.com`,
  },
  institutions: {
    subject: 'Partnership – Mon Organisation, a Unique Destination to Discover',
    body: `Hello [FirstName],

I am reaching out to explore a collaboration opportunity with Mon Organisation.

Mon Organisation is the world's largest urban agriculture cooperative, housed in a 17,000 m² building in Montreal. It brings together 20 businesses producing cider, wine, mushrooms, leafy greens and rooftop flowers, raising insects and fish, distributing exotic plants, repurposing surplus produce, and building short supply chains — all within a circular economy model.

We welcome groups for immersive guided tours of 1.5 to 2 hours — corporate teams, schools, institutions, delegations — with meetings with member entrepreneurs and a tour of the facilities: rooftop farm, composter, cold room, shared kitchens.

We would love to discuss how Mon Organisation could integrate into your offerings or recommendations.

I would be happy to organize a visit of the facilities at your convenience.

Nora Azouz
Communications & Events Manager
Mon Organisation | contact@monorganisation.com | monorganisation.com`,
  },
};
