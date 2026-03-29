import { NextRequest } from 'next/server';
import { google } from 'googleapis';

function getAuth() {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!serviceEmail || !privateKey) return null;
  return new google.auth.GoogleAuth({
    credentials: { client_email: serviceEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function normalizeDate(raw: string): string {
  const match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, m, d, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return raw;
}

function parseGroupType(raw: string): string {
  const v = (raw || '').toLowerCase();
  if (v.includes('corporatif') || v.includes('corporate') || v.includes('entreprise')) return 'corporatif';
  if (v.includes('scolaire') || v.includes('école') || v.includes('ecole') || v.includes('school') || v.includes('obnl')) return 'scolaire';
  return 'institution';
}

function parseVisitType(raw: string): string {
  const v = (raw || '').toLowerCase();
  if (v.includes('alimentaire') || v.includes('alimentary')) return 'alimentaire';
  if (v.includes('agriculture') || v.includes('urbaine')) return 'agriculture_urbaine';
  if (v.includes('circulaire') || v.includes('circular')) return 'economie_circulaire';
  if (v.includes('culinaire') || v.includes('culinary') || v.includes('dégustation') || v.includes('lunch')) return 'culinaire';
  return 'alimentaire';
}

function parseCulinaryFormula(raw: string): string {
  const v = (raw || '').toLowerCase();
  if (v.includes('découverte') || v.includes('decouverte') || v.includes('12')) return 'decouverte';
  if (v.includes('dégustation') || v.includes('degustation') || v.includes('10')) return 'degustation';
  if (v.includes('lunch') || v.includes('boîte') || v.includes('boite')) return 'boite_lunch';
  if (v.includes('buffet')) return 'buffet';
  if (v.includes('cocktail')) return 'cocktail';
  if (v.includes('aucune') || v.includes('none') || v === '') return 'none';
  return 'none';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('sheetId') || process.env.BOOKING_SHEET_ID;
  const tabName = searchParams.get('tabName') || process.env.BOOKING_FORM_TAB || 'Réponses au formulaire 1';

  if (!sheetId) {
    return Response.json(
      { error: 'No booking sheet ID configured. Add BOOKING_SHEET_ID to .env.local or configure in Settings.' },
      { status: 400 }
    );
  }

  const auth = getAuth();
  if (!auth) {
    return Response.json(
      { error: 'Google service account not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local' },
      { status: 500 }
    );
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    // Step 1: find the exact sheet title via metadata (avoids quoting issues with spaces)
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetMeta = meta.data.sheets?.find(
      (s) => s.properties?.title?.trim().toLowerCase() === tabName.trim().toLowerCase()
    );
    if (!sheetMeta) {
      const available = meta.data.sheets?.map((s) => s.properties?.title).join(', ');
      return Response.json(
        { error: `Tab "${tabName}" not found. Available tabs: ${available}` },
        { status: 404 }
      );
    }

    // Step 2: fetch using exact title — googleapis URL-encodes spaces automatically
    const exactTitle = sheetMeta.properties!.title!;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: exactTitle,
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
      return Response.json({ bookings: [] });
    }

    // Skip header row (row index 0), data starts at row index 1
    // Sheet columns (Google Form default order):
    // A=Timestamp | B=Nom | C=Courriel | D=Téléphone | E=Organisation
    // F=Type groupe | G=Type visite | H=Date souhaitée | I=Nb personnes
    // J=Formule culinaire | K=Notes | L=Réponse admin
    const bookings = rows.slice(1).map((row, idx) => {
      const [
        timestamp = '',
        fullName = '',
        email = '',
        phone = '',
        organization = '',
        groupTypeRaw = '',
        visitTypeRaw = '',
        preferredDate = '',
        nbPeopleRaw = '',
        culinaryFormulaRaw = '',
        notes = '',
        adminResponse = '',
      ] = row;

      return {
        id: String(idx + 2), // 1-based row index (row 1 = header, data starts at row 2)
        rowIndex: idx + 2,
        timestamp,
        fullName,
        email,
        phone: phone || undefined,
        organization,
        groupType: parseGroupType(groupTypeRaw),
        visitType: parseVisitType(visitTypeRaw),
        preferredDate: normalizeDate(preferredDate),
        nbPeople: parseInt(nbPeopleRaw, 10) || 0,
        culinaryFormula: parseCulinaryFormula(culinaryFormulaRaw),
        notes: notes || undefined,
        adminResponse: adminResponse || undefined,
      };
    });

    return Response.json({ bookings });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Bookings fetch error:', msg);
    return Response.json({ error: `Failed to fetch bookings: ${msg}` }, { status: 500 });
  }
}
