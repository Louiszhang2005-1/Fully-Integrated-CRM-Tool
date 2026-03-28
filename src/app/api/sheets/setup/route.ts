import { NextRequest } from 'next/server';
import { google } from 'googleapis';

/**
 * One-time setup — creates 4 tabs:
 *
 *  Corporatif          → prospect pipeline for corporate contacts
 *  Écoles              → prospect pipeline for school contacts
 *  Institutions & Médias → prospect pipeline for media contacts
 *  Envoyés             → confirmed sent log (all categories combined)
 *
 * Each pipeline tab has: Date ajout | Nom | Titre | Organisation | Courriel | LinkedIn | Canal | Statut (dropdown) | Date envoi | Notes
 * Envoyés tab has:       Date envoi | Nom | Titre | Organisation | Courriel | LinkedIn | Audience | Canal | Objet du message | Réponse
 *
 * Safe to call multiple times — skips tabs that already exist.
 */

const PIPELINE_TABS = ['Corporatif', 'Écoles', 'Institutions & Médias'];

const PIPELINE_HEADERS = [
  'Date ajout',
  'Nom',
  'Titre',
  'Organisation',
  'Courriel',
  'LinkedIn',
  'Canal',
  'Statut',       // col H — dropdown
  'Date envoi',
  'Notes',
];

const SENT_TAB = 'Envoyés';
const SENT_HEADERS = [
  'Date envoi',
  'Nom',
  'Titre',
  'Organisation',
  'Courriel',
  'LinkedIn',
  'Audience',
  'Canal',
  'Objet du message',
  'Réponse',      // col J — dropdown
];

const PIPELINE_STATUS_OPTIONS = [
  'À contacter',
  'Envoyé',
  'En discussion',
  'Confirmé',
  'Refusé',
  'Ne pas contacter',
];

const RESPONSE_OPTIONS = [
  'En attente',
  'Répondu — intéressé',
  'Répondu — pas intéressé',
  'Réunion planifiée',
  'Confirmation reçue',
  'Sans réponse',
];

// Brand green
const HEADER_BG = { red: 0.176, green: 0.416, blue: 0.18 };
// Teal for Envoyés tab header
const SENT_HEADER_BG = { red: 0.11, green: 0.47, blue: 0.55 };

function getAuth() {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!serviceEmail || !privateKey) return null;
  return new google.auth.GoogleAuth({
    credentials: { client_email: serviceEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function headerFormatRequests(tabId: number, bg: typeof HEADER_BG, colCount: number) {
  return [
    // Bold + coloured background
    {
      repeatCell: {
        range: { sheetId: tabId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: bg,
            textFormat: {
              bold: true,
              foregroundColor: { red: 1, green: 1, blue: 1 },
              fontSize: 10,
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    },
    // Freeze header row
    {
      updateSheetProperties: {
        properties: { sheetId: tabId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount',
      },
    },
    // Auto-resize columns
    {
      autoResizeDimensions: {
        dimensions: { sheetId: tabId, dimension: 'COLUMNS', startIndex: 0, endIndex: colCount },
      },
    },
  ];
}

function dropdownRequest(tabId: number, colIndex: number, options: string[]) {
  return {
    setDataValidation: {
      range: {
        sheetId: tabId,
        startRowIndex: 1,
        endRowIndex: 1000,
        startColumnIndex: colIndex,
        endColumnIndex: colIndex + 1,
      },
      rule: {
        condition: {
          type: 'ONE_OF_LIST',
          values: options.map((v) => ({ userEnteredValue: v })),
        },
        showCustomUi: true,
        strict: false,
      },
    },
  };
}

export async function POST(_request: NextRequest) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const auth = getAuth();

    if (!sheetId || !auth) {
      return Response.json(
        { error: 'Google Sheets not configured. Add GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY to .env.local' },
        { status: 500 }
      );
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch existing tabs
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingTabs = new Set((spreadsheet.data.sheets || []).map((s) => s.properties?.title));

    const allTabs = [...PIPELINE_TABS, SENT_TAB];
    const tabsToCreate = allTabs.filter((t) => !existingTabs.has(t));

    if (tabsToCreate.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: tabsToCreate.map((title) => ({ addSheet: { properties: { title } } })),
        },
      });
    }

    // Re-fetch to get numeric sheetIds
    const updated = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const tabIdMap: Record<string, number> = {};
    for (const s of updated.data.sheets || []) {
      if (s.properties?.title && s.properties.sheetId !== undefined) {
        tabIdMap[s.properties.title] = s.properties.sheetId as number;
      }
    }

    const batchRequests: object[] = [];

    // ── Pipeline tabs ──────────────────────────────────────────────────────
    for (const tabName of PIPELINE_TABS) {
      const tabId = tabIdMap[tabName];
      if (tabId === undefined) continue;

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tabName}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: { values: [PIPELINE_HEADERS] },
      });

      batchRequests.push(...headerFormatRequests(tabId, HEADER_BG, PIPELINE_HEADERS.length));
      // Statut dropdown on column H (index 7)
      batchRequests.push(dropdownRequest(tabId, 7, PIPELINE_STATUS_OPTIONS));
    }

    // ── Envoyés tab ────────────────────────────────────────────────────────
    const sentTabId = tabIdMap[SENT_TAB];
    if (sentTabId !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${SENT_TAB}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: { values: [SENT_HEADERS] },
      });

      batchRequests.push(...headerFormatRequests(sentTabId, SENT_HEADER_BG, SENT_HEADERS.length));
      // Réponse dropdown on column J (index 9)
      batchRequests.push(dropdownRequest(sentTabId, 9, RESPONSE_OPTIONS));
    }

    if (batchRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests: batchRequests },
      });
    }

    return Response.json({
      success: true,
      message: `Feuille configurée : ${allTabs.join(', ')}`,
      tabsCreated: tabsToCreate,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Sheets setup error:', msg);
    return Response.json({ error: `Sheets setup error: ${msg}` }, { status: 500 });
  }
}
