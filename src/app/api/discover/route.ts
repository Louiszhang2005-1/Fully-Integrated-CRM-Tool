import { NextRequest } from 'next/server';
import { AudienceType } from '@/lib/types';

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
      return Response.json(
        { error: 'Apollo API key not configured. Add APOLLO_API_KEY to .env.local' },
        { status: 500 }
      );
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
