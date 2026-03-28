import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { contactName, contactTitle, contactOrg, audienceType, template } = await request.json();

    if (!contactName) {
      return Response.json({ error: 'Contact name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Tu es une rédactrice professionnelle travaillant pour La Centrale Agricole, la plus grande coopérative d'agriculture urbaine au monde, située à Montréal. Tu rédiges des messages d'outreach personnalisés en français québécois professionnel.

Règles:
- Ton chaleureux mais professionnel
- Utilise le vouvoiement
- Mentionne la Centrale Agricole et ses caractéristiques clés
- Personnalise en fonction du titre et de l'organisation du contact
- Limite le message email à 150-200 mots, le message LinkedIn à 100 mots max
- Inclus une signature de Nora Azouz, Responsable communications et événements
- Ne mets PAS de crochets ou de placeholders — utilise les vraies infos du contact

Génère un courriel personnalisé pour ce contact:

Nom: ${contactName}
Titre: ${contactTitle || 'Professionnel'}
Organisation: ${contactOrg || 'Organisation'}
Type d'audience: ${audienceType || 'corporatif'}

Contexte sur La Centrale Agricole:
- Plus grande coopérative d'agriculture urbaine au monde
- 20 entreprises sous un même toit de 17 000 m² à Montréal
- Économie circulaire : cidre, vin, champignons, légumes-feuilles, fleurs sur les toits, élevage d'insectes et poissons, plantes exotiques, revalorisation alimentaire, circuits courts
- Visites guidées de 1h30 à 2h : accueil, rencontre de 1 à 3 membres, installations partagées (toit cultivé, composteur, chambre froide, cuisines collectives)
- Tarif corporatif : 450 $ + taxes (20 pers max), 22,50 $/personne supplémentaire
- Tarif scolaire/OBNL : 300 $ + taxes (20 pers max), 15 $/personne supplémentaire
- Dégustation optionnelle disponible

Modèle de base fourni (adapte-le, ne le copie pas textuellement):
${template || 'Pas de modèle fourni'}

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, exactement comme ceci:
{"subject": "L'objet du courriel", "body": "Le corps du courriel complet", "linkedin": "Version plus courte pour LinkedIn (100 mots max)"}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const rawText = response.text || '';

    // Parse JSON from Gemini's response
    // Strip markdown code fences if present
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return Response.json(
        { error: 'Could not parse Gemini response', raw: rawText },
        { status: 500 }
      );
    }

    const generated = JSON.parse(jsonMatch[0]);

    return Response.json({
      subject: generated.subject || 'Visite – La Centrale Agricole',
      body: generated.body || rawText,
      linkedin: generated.linkedin || '',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Generate error:', msg);
    return Response.json(
      { error: `Message generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
