import { NextRequest } from 'next/server';
import { google } from 'googleapis';

/**
 * Writes a contact row to the correct Google Sheets tab.
 *
 * Pass `target: 'sent'`     → writes to "Envoyés" (confirmed sent log, no limit)
 * Pass `target: 'pipeline'` → writes to audience tab: Corporatif / Écoles / Institutions & Médias
 *                              (MVP_LIMIT rows per tab — returns 429 when reached)
 *
 * Default target when omitted: 'sent'
 *
 * Run POST /api/sheets/setup once to create all tabs with headers and dropdowns.
 */

const MVP_LIMIT = 5;

const PIPELINE_TAB: Record<string, string> = {
  corporatif: 'Corporatif',
  ecoles: 'Écoles',
  institutions: 'Institutions & Médias',
};

const SENT_TAB = 'Envoyés';

function getAuth() {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!serviceEmail || !privateKey) return null;
  return new google.auth.GoogleAuth({
    credentials: { client_email: serviceEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function POST(request: NextRequest) {
  try {
    const {
      target = 'sent',   // 'sent' | 'pipeline'
      name,
      email,
      phone,
      title,
      org,
      linkedinUrl,
      audienceType,
      subject,
      channel,
      sentAt,
      status,
    } = await request.json();

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const auth = getAuth();

    if (!sheetId || !auth) {
      return Response.json(
        { error: 'Google Sheets not configured.' },
        { status: 500 }
      );
    }

    const sheets = google.sheets({ version: 'v4', auth });

    const now = new Date().toLocaleString('fr-CA', {
      timeZone: 'America/Toronto',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

    const sentDate = sentAt
      ? new Date(sentAt).toLocaleString('fr-CA', {
          timeZone: 'America/Toronto',
          year: 'numeric', month: '2-digit', day: '2-digit',
        })
      : now.split(',')[0];

    // ── Columns for ALL tabs: Date | Nom | Courriel | Téléphone | Titre | Organisation | LinkedIn | Audience | Objet | Canal | Statut

    const audienceLabel =
      audienceType === 'corporatif' ? 'Corporatif'
      : audienceType === 'ecoles' ? 'Écoles'
      : audienceType === 'institutions' ? 'Institutions & Médias'
      : audienceType || '';

    const row = [
      target === 'sent' ? sentDate : now,  // A: Date
      name || '',                           // B: Nom
      email || '',                          // C: Courriel
      phone || '',                          // D: Téléphone
      title || '',                          // E: Titre
      org || '',                            // F: Organisation
      linkedinUrl || '',                    // G: LinkedIn
      audienceLabel,                        // H: Audience
      subject || '',                        // I: Objet
      channel || 'email',                   // J: Canal
      status || (target === 'sent' ? 'Envoyé' : 'À contacter'), // K: Statut
    ];

    // ── Envoyés tab (confirmed sent log, no limit) ───────────────────────────
    if (target === 'sent') {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${SENT_TAB}!A:K`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
      return Response.json({ success: true, tab: SENT_TAB, message: `Ajouté dans "${SENT_TAB}"` });
    }

    // ── Pipeline tab (discovery / prospect list, MVP limit) ──────────────────
    const tabName = PIPELINE_TAB[audienceType as string] || 'Corporatif';

    const countRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!A:A`,
    });
    const existingRows = (countRes.data.values?.length || 1) - 1;

    if (existingRows >= MVP_LIMIT) {
      return Response.json(
        {
          error: 'mvp_limit',
          message: `Limite MVP de ${MVP_LIMIT} contacts atteinte pour l'onglet "${tabName}".`,
          tab: tabName,
          count: existingRows,
        },
        { status: 429 }
      );
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A:K`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return Response.json({
      success: true,
      tab: tabName,
      message: `Ajouté dans "${tabName}" (${existingRows + 1}/${MVP_LIMIT})`,
      remaining: MVP_LIMIT - existingRows - 1,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Google Sheets error:', msg);
    return Response.json({ error: `Google Sheets error: ${msg}` }, { status: 500 });
  }
}
