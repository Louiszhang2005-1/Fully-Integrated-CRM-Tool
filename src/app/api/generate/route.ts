import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CASE_STUDIES: Record<string, string> = {
  corporatif: `
Exemples de contexte et d'angle pour le corporatif:
- Les entreprises qui ont visité témoignent d'un fort impact sur la cohésion d'équipe et les valeurs RSE/ESG.
- Format idéal pour journée de team-building originale, hors des sentiers battus.
- Plusieurs grandes entreprises québécoises (Desjardins, Hydro-Québec, Bell) ont intégré nos visites à leurs programmes d'engagement employé.
- La visite dure 1h30 à 2h, se conclut optionnellement par une dégustation de produits locaux membres (cidre, champignons, kombucha, etc.).
- Tarif : 450 $+tx pour 20 personnes, 22,50 $/pers supplémentaire.
- Angle à adapter selon le titre : HR/Talents → bien-être et engagement employé ; Communications/RSE → vitrine ESG concrète ; Événementiel → expérience unique clé en main.`,

  ecoles: `
Exemples de contexte et d'angle pour les écoles:
- La visite est adaptée au niveau du groupe : primaire, secondaire, cégep, université.
- Concepts abordés concrètement : alimentation locale, circuits courts, économie circulaire, production zéro-déchet.
- Utilisée par des enseignants de sciences, géographie, développement durable et entrepreneuriat.
- Plusieurs écoles et cégeps de Montréal l'ont intégrée à leurs sorties scolaires annuelles.
- Tarif : 300 $+tx pour 20 personnes (groupes scolaires/OBNL), 15 $/élève supplémentaire.
- Angle à adapter : enseignant/directeur → programme pédagogique, arrimage avec les compétences du curriculum ; université → développement durable, économie sociale, innovation alimentaire.`,

  institutions: `
Exemples de contexte et d'angle pour les institutions et médias:
- La Centrale est un lieu de presse unique : 20 entreprises, une seule adresse, économie circulaire visible à l'œil nu.
- Angle médias : dossier agriculture urbaine, alimentation de proximité, innovation québécoise, coopératives.
- Angle tourisme : destination incontournable pour les délégations, les voyageurs d'affaires et les touristes curieux.
- Angle agences événementielles : lieu atypique pour événements corporatifs ou de réseautage.
- Une visite de presse peut être organisée à la convenance du journaliste ou de la rédaction.`,
};

export async function POST(request: NextRequest) {
  try {
    const {
      contactName,
      contactTitle,
      contactOrg,
      audienceType,
      template,
      keywords,
      pdfUrl,
      websiteUrl,
      bookingLink,
    } = await request.json();

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

    const visitLink = websiteUrl || 'https://centrale.coop/les-visites/';
    const caseStudy = CASE_STUDIES[audienceType] || CASE_STUDIES['corporatif'];

    const linksBlock = [
      `- Lien page visites : ${visitLink}`,
      pdfUrl ? `- Guide PDF des visites : ${pdfUrl}` : null,
      bookingLink ? `- Lien de réservation : ${bookingLink}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const keywordsBlock = keywords
      ? `\nMots-clés à intégrer naturellement dans le message : ${keywords}`
      : '';

    const prompt = `Tu es une rédactrice professionnelle travaillant pour La Centrale Agricole, la plus grande coopérative d'agriculture urbaine au monde, située à Montréal. Tu rédiges des messages d'outreach personnalisés en français québécois professionnel.

Règles:
- Ton chaleureux mais professionnel
- Utilise le vouvoiement
- Personnalise en fonction du titre et de l'organisation du contact
- Limite le message email à 150-200 mots, le message LinkedIn à 100 mots max
- Inclus une signature de Nora Azouz, Responsable communications et événements, La Centrale Agricole | nora@centrale.coop | centrale.coop
- Ne mets PAS de crochets ou de placeholders — utilise les vraies infos du contact
- Inclus naturellement le lien de la page visites dans le corps du message
- Si un PDF est fourni, invite le contact à le consulter
- Si un lien de réservation est fourni, termine avec un appel à l'action vers ce lien
- Ajoute une ligne de désinscription CASL discrète à la fin : "Si vous ne souhaitez plus recevoir de communications, répondez à ce courriel."

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
- Expérience culinaire optionnelle : 3 bouchées (12$/pers), dégustation vin/cidre (10$/pers), boîte à lunch (20-22$), buffet froid (25-35$), cocktail dinatoire (45-50$)
${caseStudy}

Liens à inclure dans l'email:
${linksBlock}
${keywordsBlock}

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
