import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const CASE_STUDIES: Record<string, string> = {
  corporatif: `
Context and angles for corporate outreach:
- Companies that have visited report a strong impact on team cohesion and ESG/CSR values.
- An ideal format for an original team-building day, off the beaten path.
- Several major Quebec companies (Desjardins, Hydro-Quebec, Bell) have integrated our visits into their employee engagement programs.
- The visit lasts 1.5 to 2 hours, optionally concluding with a tasting of local member products (cider, mushrooms, kombucha, etc.).
- Pricing: $450 + tax for 20 people, $22.50/person additional.
- Angle to adapt by title: HR/Talent → employee wellness and engagement; Communications/ESG → concrete ESG showcase; Events → unique turnkey experience.`,

  ecoles: `
Context and angles for school outreach:
- The visit is adapted to the group level: elementary, secondary, CEGEP, university.
- Concepts explored hands-on: local food systems, short supply chains, circular economy, zero-waste production.
- Used by science, geography, sustainability, and entrepreneurship teachers.
- Several Montreal schools and CEGEPs have integrated it into their annual field trips.
- Pricing: $300 + tax for 20 people (school/non-profit groups), $15/student additional.
- Angle to adapt: teacher/principal → pedagogical program, alignment with curriculum competencies; university → sustainability, social economy, food innovation.`,

  institutions: `
Context and angles for institutions and media outreach:
- Mon Organisation is a unique press destination: 20 businesses, one address, circular economy visible at a glance.
- Media angle: urban agriculture, local food, Quebec innovation, cooperatives.
- Tourism angle: a must-see destination for delegations, business travelers, and curious tourists.
- Event agency angle: an atypical venue for corporate or networking events.
- A press visit can be arranged at the journalist's or editorial team's convenience.`,
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

    const visitLink = websiteUrl || 'https://monorganisation.com/les-visites/';
    const formLink = bookingLink || 'https://docs.google.com/forms/d/e/1FAIpQLSdxra3cCffMxZMlEVXF1f-V4D69zd5PsqhNh--B-XKGyhtLNQ/viewform?usp=header';
    const caseStudy = CASE_STUDIES[audienceType] || CASE_STUDIES['corporatif'];

    const linksBlock = [
      `- Website & visits: ${visitLink}`,
      `- Booking form: ${formLink}`,
      pdfUrl ? `- Visit guide PDF: ${pdfUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const keywordsBlock = keywords
      ? `\nKeywords to naturally integrate into the message: ${keywords}`
      : '';

    const prompt = `You are a professional writer working for Mon Organisation, the world's largest urban agriculture cooperative, located in Montreal. You write personalized outreach messages in professional English.

Rules:
- Warm but professional tone
- Personalize based on the contact's title and organization
- Keep the email message to 150-200 words, the LinkedIn message to 100 words max
- Include a signature from Nora Azouz, Communications & Events Manager, Mon Organisation | contact@monorganisation.com | monorganisation.com
- Do NOT use brackets or placeholders — use the real contact information
- Do NOT use ANY emoji in the email or LinkedIn message
- Naturally include the website link (monorganisation.com/les-visites/) in the body
- Always end the email with a call to action toward the provided booking form
- Add a discreet CASL unsubscribe line at the end: "If you no longer wish to receive communications, please reply to this email."

Generate a personalized email for this contact:

Name: ${contactName}
Title: ${contactTitle || 'Professional'}
Organization: ${contactOrg || 'Organization'}
Audience type: ${audienceType || 'corporatif'}

Context about Mon Organisation:
- World's largest urban agriculture cooperative
- 20 businesses under one 17,000 m² roof in Montreal
- Circular economy: cider, wine, mushrooms, leafy greens, rooftop flowers, insect and fish farming, exotic plants, food repurposing, short supply chains
- Guided tours 1.5 to 2 hours: welcome, meeting with 1 to 3 member businesses, shared facilities (rooftop farm, composter, cold room, shared kitchens)
- Corporate pricing: $450 + tax (max 20 people), $22.50/person additional
- School/non-profit pricing: $300 + tax (max 20 people), $15/person additional
- Optional culinary experience: 3 bites ($12/person), wine/cider tasting ($10/person), lunch box ($20-22), cold buffet ($25-35), cocktail dinner ($45-50)
${caseStudy}

Links to include in the email:
${linksBlock}
${keywordsBlock}

Base template provided (adapt it, do not copy it verbatim):
${template || 'No template provided'}

IMPORTANT: Reply ONLY with a valid JSON object, no markdown, no backticks, exactly like this:
{"subject": "The email subject", "body": "The complete email body", "linkedin": "Shorter version for LinkedIn (100 words max)"}`;

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

    // Always inject the links at the end of the body so they appear
    // regardless of whether Gemini chose to include them.
    const generatedBody: string = generated.body || rawText;
    const ctaBlock = `\nTo book your visit, fill out the form here: ${formLink}\n\nLearn more about our visits: ${visitLink}`;
    const bodyAlreadyHasForm = generatedBody.includes('docs.google.com/forms') || generatedBody.includes(formLink);
    const finalBody = bodyAlreadyHasForm ? generatedBody : generatedBody + '\n' + ctaBlock;

    return Response.json({
      subject: generated.subject || 'Visit – Mon Organisation',
      body: finalBody,
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
