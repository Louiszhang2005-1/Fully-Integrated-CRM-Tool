import { NextRequest } from 'next/server';
import { AudienceType } from '@/lib/types';

// ─── Demo mode mock data ──────────────────────────────────────────────────────

const MOCK_CONTACTS: Record<string, object[]> = {
  corporatif: [
    { name: 'Marie-Ève Tremblay', firstName: 'Marie-Ève', lastName: 'Tremblay', title: 'Directrice générale', organization: 'Coop Carbone', city: 'Montréal, QC', email: 'm.tremblay@coopcarbone.coop', linkedinUrl: 'https://linkedin.com/in/marie-eve-tremblay-mtl', photoUrl: null },
    { name: 'Jean-Philippe Côté', firstName: 'Jean-Philippe', lastName: 'Côté', title: 'VP Développement durable', organization: 'Hydro-Québec', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/jp-cote-hq', photoUrl: null },
    { name: 'Sophie Bergeron', firstName: 'Sophie', lastName: 'Bergeron', title: 'Directrice des ressources humaines', organization: 'Desjardins', city: 'Montréal, QC', email: 's.bergeron@desjardins.com', linkedinUrl: 'https://linkedin.com/in/sophie-bergeron-dj', photoUrl: null },
    { name: 'Alexandre Ouellet', firstName: 'Alexandre', lastName: 'Ouellet', title: 'Responsable bien-être et culture', organization: 'Ubisoft Montréal', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/alex-ouellet-ubi', photoUrl: null },
    { name: 'Isabelle Lavoie', firstName: 'Isabelle', lastName: 'Lavoie', title: 'Directrice expérience employé', organization: 'BNC', city: 'Montréal, QC', email: 'i.lavoie@bnc.ca', linkedinUrl: 'https://linkedin.com/in/isabelle-lavoie-bnc', photoUrl: null },
    { name: 'Pierre-Luc Gagnon', firstName: 'Pierre-Luc', lastName: 'Gagnon', title: 'Directeur général', organization: 'Fondation David Suzuki', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/pl-gagnon-fds', photoUrl: null },
    { name: 'Nathalie Fortin', firstName: 'Nathalie', lastName: 'Fortin', title: 'Chef People Officer', organization: 'Lightspeed Commerce', city: 'Montréal, QC', email: 'n.fortin@lightspeedcommerce.com', linkedinUrl: 'https://linkedin.com/in/nathalie-fortin-ls', photoUrl: null },
    { name: 'Marc-Antoine Dubois', firstName: 'Marc-Antoine', lastName: 'Dubois', title: 'Directeur marketing', organization: 'Sid Lee', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/ma-dubois-sidlee', photoUrl: null },
    { name: 'Caroline Ménard', firstName: 'Caroline', lastName: 'Ménard', title: 'Responsable événements', organization: 'Cirque du Soleil', city: 'Montréal, QC', email: 'c.menard@cirquedusoleil.com', linkedinUrl: 'https://linkedin.com/in/caroline-menard-cds', photoUrl: null },
    { name: 'François Pelletier', firstName: 'François', lastName: 'Pelletier', title: 'Directeur communications', organization: 'CAE', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/f-pelletier-cae', photoUrl: null },
    { name: 'Émilie Roy', firstName: 'Émilie', lastName: 'Roy', title: 'VP Ressources humaines', organization: 'Bombardier', city: 'Montréal, QC', email: 'e.roy@bombardier.com', linkedinUrl: 'https://linkedin.com/in/emilie-roy-bombardier', photoUrl: null },
    { name: 'Simon Lapointe', firstName: 'Simon', lastName: 'Lapointe', title: 'Directeur général', organization: 'Équiterre', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/simon-lapointe-eq', photoUrl: null },
  ],
  ecoles: [
    { name: 'Lucie Charron', firstName: 'Lucie', lastName: 'Charron', title: 'Directrice d\'école', organization: 'École primaire Saint-Nom-de-Jésus', city: 'Montréal, QC', email: 'l.charron@cssdm.qc.ca', linkedinUrl: 'https://linkedin.com/in/lucie-charron-snj', photoUrl: null },
    { name: 'Robert Lachance', firstName: 'Robert', lastName: 'Lachance', title: 'Directeur adjoint', organization: 'Collège Brébeuf', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/robert-lachance-brebeuf', photoUrl: null },
    { name: 'Andrée Vaillancourt', firstName: 'Andrée', lastName: 'Vaillancourt', title: 'Coordonnatrice pédagogique', organization: 'École des sciences de Montréal', city: 'Montréal, QC', email: 'a.vaillancourt@cssdm.qc.ca', linkedinUrl: 'https://linkedin.com/in/andree-vaillancourt-esm', photoUrl: null },
    { name: 'Denis Bédard', firstName: 'Denis', lastName: 'Bédard', title: 'Directeur', organization: 'Collège de Maisonneuve', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/denis-bedard-cdm', photoUrl: null },
    { name: 'Josée Marchand', firstName: 'Josée', lastName: 'Marchand', title: 'Responsable sorties éducatives', organization: 'École Notre-Dame-de-Grâce', city: 'Montréal, QC', email: 'j.marchand@csdm.ca', linkedinUrl: 'https://linkedin.com/in/josee-marchand-ndg', photoUrl: null },
    { name: 'Yannick Desrosiers', firstName: 'Yannick', lastName: 'Desrosiers', title: 'Animateur parascolaire', organization: 'École Antoine-Brossard', city: 'Longueuil, QC', email: null, linkedinUrl: 'https://linkedin.com/in/yannick-desrosiers-ab', photoUrl: null },
    { name: 'Mélanie Grondin', firstName: 'Mélanie', lastName: 'Grondin', title: 'Directrice pédagogique', organization: 'CSSDM', city: 'Montréal, QC', email: 'm.grondin@cssdm.qc.ca', linkedinUrl: 'https://linkedin.com/in/melanie-grondin-cssdm', photoUrl: null },
    { name: 'Patrick Lemaire', firstName: 'Patrick', lastName: 'Lemaire', title: 'Enseignant sciences', organization: 'Collège Ahuntsic', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/patrick-lemaire-cahun', photoUrl: null },
    { name: 'Valérie Desmarais', firstName: 'Valérie', lastName: 'Desmarais', title: 'Vice-principale', organization: 'École secondaire Édouard-Montpetit', city: 'Longueuil, QC', email: 'v.desmarais@cssh.qc.ca', linkedinUrl: 'https://linkedin.com/in/valerie-desmarais-em', photoUrl: null },
    { name: 'Thomas Paradis', firstName: 'Thomas', lastName: 'Paradis', title: 'Chargé de projet éducatif', organization: 'Commission scolaire Marguerite-Bourgeoys', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/thomas-paradis-csmb', photoUrl: null },
    { name: 'Hélène Julien', firstName: 'Hélène', lastName: 'Julien', title: 'Directrice', organization: 'École Willingdon', city: 'Montréal, QC', email: 'h.julien@csdm.ca', linkedinUrl: 'https://linkedin.com/in/helene-julien-wdm', photoUrl: null },
    { name: 'Gabriel Thibault', firstName: 'Gabriel', lastName: 'Thibault', title: 'Directeur adjoint', organization: 'Collège Laval', city: 'Laval, QC', email: null, linkedinUrl: 'https://linkedin.com/in/gabriel-thibault-cl', photoUrl: null },
  ],
  institutions: [
    { name: 'Annick Beauséjour', firstName: 'Annick', lastName: 'Beauséjour', title: 'Journaliste', organization: 'Le Devoir', city: 'Montréal, QC', email: 'a.beausejour@ledevoir.com', linkedinUrl: 'https://linkedin.com/in/annick-beausejour-ld', photoUrl: null },
    { name: 'Pascal Bélanger', firstName: 'Pascal', lastName: 'Bélanger', title: 'Rédacteur en chef', organization: 'La Presse', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/pascal-belanger-lp', photoUrl: null },
    { name: 'Geneviève Racine', firstName: 'Geneviève', lastName: 'Racine', title: 'Directrice des communications', organization: 'Ville de Montréal', city: 'Montréal, QC', email: 'g.racine@montreal.ca', linkedinUrl: 'https://linkedin.com/in/genevieve-racine-vm', photoUrl: null },
    { name: 'Olivier Fontaine', firstName: 'Olivier', lastName: 'Fontaine', title: 'Attaché de presse', organization: 'Gouvernement du Québec', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/olivier-fontaine-gouv', photoUrl: null },
    { name: 'Stéphanie Brault', firstName: 'Stéphanie', lastName: 'Brault', title: 'Directrice générale', organization: 'Nature Québec', city: 'Montréal, QC', email: 's.brault@naturequebec.org', linkedinUrl: 'https://linkedin.com/in/stephanie-brault-nq', photoUrl: null },
    { name: 'Louis-Alexandre Morin', firstName: 'Louis-Alexandre', lastName: 'Morin', title: 'Chroniqueur environnement', organization: 'Radio-Canada', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/la-morin-src', photoUrl: null },
    { name: 'Catherine Lépine', firstName: 'Catherine', lastName: 'Lépine', title: 'Responsable relations médias', organization: 'Fondation de la faune du Québec', city: 'Montréal, QC', email: 'c.lepine@fondationdelafaune.qc.ca', linkedinUrl: 'https://linkedin.com/in/catherine-lepine-ffq', photoUrl: null },
    { name: 'Mathieu Grégoire', firstName: 'Mathieu', lastName: 'Grégoire', title: 'Reporter', organization: 'TVA Nouvelles', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/mathieu-gregoire-tva', photoUrl: null },
    { name: 'Diane Leclerc', firstName: 'Diane', lastName: 'Leclerc', title: 'Coordonnatrice communications', organization: 'Oxfam-Québec', city: 'Montréal, QC', email: 'd.leclerc@oxfam.qc.ca', linkedinUrl: 'https://linkedin.com/in/diane-leclerc-oxfam', photoUrl: null },
    { name: 'Hugo Saint-Pierre', firstName: 'Hugo', lastName: 'Saint-Pierre', title: 'Responsable partenariats', organization: 'Festivals et Événements Québec', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/hugo-saint-pierre-feq', photoUrl: null },
    { name: 'Joëlle Champagne', firstName: 'Joëlle', lastName: 'Champagne', title: 'Directrice exécutive', organization: 'Conseil régional de l\'environnement de Montréal', city: 'Montréal, QC', email: 'j.champagne@cremtl.qc.ca', linkedinUrl: 'https://linkedin.com/in/joelle-champagne-crem', photoUrl: null },
    { name: 'Benoît Arseneau', firstName: 'Benoît', lastName: 'Arseneau', title: 'Chef de pupitre', organization: 'Journal de Montréal', city: 'Montréal, QC', email: null, linkedinUrl: 'https://linkedin.com/in/benoit-arseneau-jdm', photoUrl: null },
  ],
};

const MOCK_PER_PAGE = 6;

function getMockContacts(audienceType: string, page: number) {
  const all = MOCK_CONTACTS[audienceType] || MOCK_CONTACTS.corporatif;
  const start = (page - 1) * MOCK_PER_PAGE;
  const contacts = all.slice(start, start + MOCK_PER_PAGE);
  return {
    contacts,
    totalCount: all.length,
    page,
    totalPages: Math.ceil(all.length / MOCK_PER_PAGE),
    isDemo: true,
  };
}

// Job title presets per audience — tuned for Montreal NPO outreach
const AUDIENCE_TITLES: Record<AudienceType, string[]> = {
  corporatif: [
    'Directeur général', 'CEO', 'Vice-président', 'VP',
    'Directeur des ressources humaines', 'Responsable RH',
    'Directeur des communications', 'Directeur marketing',
    'Responsable événements', 'Directeur développement durable',
    'Responsable bien-être', 'Directeur expérience employé',
    'Chief People Officer', 'Head of HR', 'Event Manager',
  ],
  ecoles: [
    'Directeur d\'école', 'Directeur adjoint', 'Principal',
    'Vice-principal', 'Enseignant', 'Enseignante', 'Professeur',
    'Coordonnateur pédagogique', 'Animateur parascolaire',
    'Responsable sorties éducatives', 'Chargé de projet éducatif',
    'Directeur pédagogique',
  ],
  institutions: [
    'Journaliste', 'Rédacteur en chef', 'Reporter',
    'Directeur des communications', 'Attaché de presse',
    'Responsable des relations médias', 'Chef de pupitre',
    'Chroniqueur', 'Directeur général', 'Directeur exécutif',
    'Coordonnateur communications', 'Responsable partenariats',
    'Chargé de relations publiques',
  ],
};

interface ApolloPerson {
  first_name?: string;
  last_name?: string;
  title?: string;
  organization?: { name?: string };
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  photo_url?: string;
  email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { audienceType, location, keywords, page = 1 } = await request.json();

    const apolloKey = process.env.APOLLO_API_KEY;
    if (!apolloKey) {
      return Response.json(getMockContacts(audienceType, page));
    }

    const titles = AUDIENCE_TITLES[audienceType as AudienceType] || [];
    const locationFilter = location?.trim() || 'Montreal, Quebec, Canada';

    const body: Record<string, unknown> = {
      page,
      per_page: 10,
      person_locations: [locationFilter],
    };

    if (titles.length > 0) {
      body.person_titles = titles;
    }
    if (keywords?.trim()) {
      body.q_keywords = keywords.trim();
    }

    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Apollo discover error:', res.status, errText);
      if (res.status === 403) {
        return Response.json(
          {
            error: 'plan_limit',
            message:
              'Votre plan Apollo ne permet pas la recherche de contacts. Mettez à niveau votre plan Apollo.io pour accéder à cette fonctionnalité.',
          },
          { status: 403 }
        );
      }
      return Response.json(
        { error: `Erreur Apollo API: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const people: ApolloPerson[] = data.people || [];
    const pagination = data.pagination || {};

    return Response.json({
      contacts: people.map((p) => ({
        name: [p.first_name, p.last_name].filter(Boolean).join(' '),
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        title: p.title || '',
        organization: p.organization?.name || '',
        city: [p.city, p.state].filter(Boolean).join(', '),
        linkedinUrl: p.linkedin_url || '',
        photoUrl: p.photo_url || null,
        email: p.email || null,
      })),
      totalCount: pagination.total_entries || people.length,
      page: pagination.page || page,
      totalPages: pagination.total_pages || 1,
    });
  } catch (error) {
    console.error('Discover error:', error);
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
