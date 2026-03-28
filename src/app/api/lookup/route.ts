import { NextRequest } from 'next/server';

// Apollo.io People Enrichment API
// Docs: https://apolloio.github.io/apollo-api-docs/?shell#people-enrichment
export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl } = await request.json();

    if (!linkedinUrl) {
      return Response.json({ error: 'LinkedIn URL is required' }, { status: 400 });
    }

    const apolloKey = process.env.APOLLO_API_KEY;
    if (!apolloKey) {
      return Response.json(
        { error: 'Apollo API key not configured. Add APOLLO_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    // Apollo.io People Search - works on free plan
    // We search by linkedin_url to find the person
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify({
        linkedin_url: linkedinUrl,
        page: 1,
        per_page: 1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Apollo API error:', res.status, errText);
      // 403 = free plan doesn't include people search
      if (res.status === 403) {
        return Response.json(
          { error: 'plan_limit', message: 'Apollo free plan does not include people search. Contact data will be simulated.' },
          { status: 403 }
        );
      }
      return Response.json(
        { error: `Apollo API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // mixed_people/search returns { people: [...] }
    const person = (data.people && data.people[0]) || data.person || null;

    if (!person) {
      return Response.json(
        { found: false, message: 'No person found for this LinkedIn URL' },
        { status: 200 }
      );
    }

    return Response.json({
      found: true,
      name: [person.first_name, person.last_name].filter(Boolean).join(' '),
      firstName: person.first_name || '',
      lastName: person.last_name || '',
      email: person.email || null,
      title: person.title || '',
      organization: person.organization?.name || '',
      city: person.city || '',
      linkedinUrl: person.linkedin_url || linkedinUrl,
      photoUrl: person.photo_url || null,
    });
  } catch (error) {
    console.error('Lookup error:', error);
    return Response.json(
      { error: 'Internal server error during lookup' },
      { status: 500 }
    );
  }
}
