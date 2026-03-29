import { NextRequest } from 'next/server';
import { Resend } from 'resend';
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

const VISIT_TYPE_LABELS: Record<string, string> = {
  alimentaire: 'Système alimentaire',
  agriculture_urbaine: 'Agriculture urbaine',
  economie_circulaire: 'Économie circulaire',
  culinaire: 'Expérience culinaire',
};

const GROUP_TYPE_LABELS: Record<string, string> = {
  corporatif: 'Corporatif',
  scolaire: 'Scolaire / OBNL',
  institution: 'Institution / Média',
};

function buildAcceptHtml(booking: {
  fullName: string;
  preferredDate: string;
  nbPeople: number;
  groupType: string;
  visitType: string;
}): string {
  const firstName = booking.fullName.split(' ')[0];
  const visitLabel = VISIT_TYPE_LABELS[booking.visitType] || booking.visitType;
  const groupLabel = GROUP_TYPE_LABELS[booking.groupType] || booking.groupType;

  return `<p>Bonjour ${firstName},</p>

<p>Nous avons le plaisir de confirmer votre réservation pour une visite à <strong>La Centrale Agricole</strong> !</p>

<ul>
  <li>📅 <strong>Date :</strong> ${booking.preferredDate}</li>
  <li>👥 <strong>Groupe :</strong> ${booking.nbPeople} personnes (${groupLabel})</li>
  <li>🌿 <strong>Type de visite :</strong> ${visitLabel}</li>
  <li>📍 <strong>Adresse :</strong> 7070 Henri-Julien Ave, Montréal, QC H2S 3B5</li>
</ul>

<p>Pour toute question, n'hésitez pas à nous écrire à <a href="mailto:nora@centrale.coop">nora@centrale.coop</a> ou à consulter notre page de visites : <a href="https://centrale.coop/les-visites/">centrale.coop/les-visites</a></p>

<p>Au plaisir de vous accueillir,</p>
<p><strong>Nora Azouz</strong><br/>
Responsable communications et événements<br/>
La Centrale Agricole | <a href="mailto:nora@centrale.coop">nora@centrale.coop</a> | centrale.coop</p>`;
}

function buildRefuseHtml(booking: { fullName: string }, reason?: string): string {
  const firstName = booking.fullName.split(' ')[0];

  return `<p>Bonjour ${firstName},</p>

<p>Merci pour votre intérêt envers <strong>La Centrale Agricole</strong>.</p>

<p>Malheureusement, nous ne sommes pas en mesure de confirmer votre visite pour la date demandée.${reason ? ` ${reason}` : ''}</p>

<p>N'hésitez pas à nous recontacter pour trouver une autre date disponible — nous serions ravis de vous accueillir.</p>

<p><strong>Nora Azouz</strong><br/>
Responsable communications et événements<br/>
La Centrale Agricole | <a href="mailto:nora@centrale.coop">nora@centrale.coop</a> | centrale.coop</p>`;
}

export async function POST(request: NextRequest) {
  try {
    const { rowIndex, action, reason, booking, sheetId, tabName } = await request.json();

    if (!rowIndex || !action || !booking) {
      return Response.json({ error: 'Missing required fields: rowIndex, action, booking' }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return Response.json(
        { error: 'Resend API key not configured. Add RESEND_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    // 1. Send email response
    const resend = new Resend(resendKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromField = `Nora Azouz — La Centrale Agricole <${fromEmail}>`;

    const isAccept = action === 'accept';
    const subject = isAccept
      ? `Confirmation de votre visite — La Centrale Agricole`
      : `Votre demande de visite — La Centrale Agricole`;
    const html = isAccept
      ? buildAcceptHtml(booking)
      : buildRefuseHtml(booking, reason);

    const { error: sendError } = await resend.emails.send({
      from: fromField,
      to: [booking.email],
      subject,
      html,
      replyTo: 'nora@centrale.coop',
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return Response.json(
        { error: `Email send failed: ${sendError.message}` },
        { status: 500 }
      );
    }

    // 2. Write admin response to column L of the booking row
    const resolvedSheetId = sheetId || process.env.BOOKING_SHEET_ID;
    const resolvedTab = tabName || process.env.BOOKING_FORM_TAB || 'Réponses au formulaire 1';

    if (resolvedSheetId) {
      const auth = getAuth();
      if (auth) {
        try {
          const sheets = google.sheets({ version: 'v4', auth });
          const responseValue = isAccept
            ? `accepted — ${new Date().toISOString()}`
            : `refused — ${new Date().toISOString()}${reason ? ` — ${reason}` : ''}`;

          // Resolve exact sheet title via metadata (avoids quoting/encoding issues)
          const meta = await sheets.spreadsheets.get({ spreadsheetId: resolvedSheetId });
          const sheetMeta = meta.data.sheets?.find(
            (s) => s.properties?.title?.trim().toLowerCase() === resolvedTab.trim().toLowerCase()
          );
          const exactTitle = sheetMeta?.properties?.title || resolvedTab;

          await sheets.spreadsheets.values.update({
            spreadsheetId: resolvedSheetId,
            range: `'${exactTitle}'!L${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[responseValue]] },
          });
        } catch (sheetErr) {
          // Non-fatal: email was already sent, just log the sheets error
          console.error('Sheet update error:', sheetErr);
        }
      }
    }

    return Response.json({ success: true, action });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Booking respond error:', msg);
    return Response.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
