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
  alimentaire: 'Food System',
  agriculture_urbaine: 'Urban Agriculture',
  economie_circulaire: 'Circular Economy',
  culinaire: 'Culinary Experience',
};

const GROUP_TYPE_LABELS: Record<string, string> = {
  corporatif: 'Corporate',
  scolaire: 'School / Non-profit',
  institution: 'Institution / Media',
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

  return `<p>Hello ${firstName},</p>

<p>We are pleased to confirm your reservation for a visit to <strong>Mon Organisation</strong>!</p>

<ul>
  <li>📅 <strong>Date:</strong> ${booking.preferredDate}</li>
  <li>👥 <strong>Group:</strong> ${booking.nbPeople} people (${groupLabel})</li>
  <li>🌿 <strong>Visit type:</strong> ${visitLabel}</li>
  <li>📍 <strong>Address:</strong> 7070 Henri-Julien Ave, Montreal, QC H2S 3B5</li>
</ul>

<p>For any questions, feel free to reach us at <a href="mailto:contact@monorganisation.com">contact@monorganisation.com</a> or visit our visits page: <a href="https://monorganisation.com/les-visites/">monorganisation.com/les-visites</a></p>

<p>Looking forward to welcoming you,</p>
<p><strong>Nora Azouz</strong><br/>
Communications &amp; Events Manager<br/>
Mon Organisation | <a href="mailto:contact@monorganisation.com">contact@monorganisation.com</a> | monorganisation.com</p>`;
}

function buildCancelHtml(booking: { fullName: string; preferredDate: string }, reason?: string): string {
  const firstName = booking.fullName.split(' ')[0];

  return `<p>Hello ${firstName},</p>

<p>We are contacting you regarding your reservation at <strong>Mon Organisation</strong> scheduled for ${booking.preferredDate}.</p>

<p>We regret to inform you that we must cancel this visit.${reason ? ` ${reason}` : ''}</p>

<p>We sincerely apologize for the inconvenience. Please do not hesitate to contact us to schedule a new date — we would be delighted to welcome you.</p>

<p>For any questions, write to us at <a href="mailto:contact@monorganisation.com">contact@monorganisation.com</a>.</p>

<p><strong>Nora Azouz</strong><br/>
Communications &amp; Events Manager<br/>
Mon Organisation | <a href="mailto:contact@monorganisation.com">contact@monorganisation.com</a> | monorganisation.com</p>`;
}

function buildRefuseHtml(booking: { fullName: string }, reason?: string): string {
  const firstName = booking.fullName.split(' ')[0];

  return `<p>Hello ${firstName},</p>

<p>Thank you for your interest in <strong>Mon Organisation</strong>.</p>

<p>Unfortunately, we are unable to confirm your visit for the requested date.${reason ? ` ${reason}` : ''}</p>

<p>Please do not hesitate to contact us to find another available date — we would be happy to welcome you.</p>

<p><strong>Nora Azouz</strong><br/>
Communications &amp; Events Manager<br/>
Mon Organisation | <a href="mailto:contact@monorganisation.com">contact@monorganisation.com</a> | monorganisation.com</p>`;
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
    const fromField = `Nora Azouz — Mon Organisation <${fromEmail}>`;

    const isAccept = action === 'accept';
    const isCancel = action === 'cancel';
    const subject = isAccept
      ? `Your visit is confirmed — Mon Organisation`
      : isCancel
      ? `Visit cancellation — Mon Organisation`
      : `Your visit request — Mon Organisation`;
    const html = isAccept
      ? buildAcceptHtml(booking)
      : isCancel
      ? buildCancelHtml(booking, reason)
      : buildRefuseHtml(booking, reason);

    const { error: sendError } = await resend.emails.send({
      from: fromField,
      to: [booking.email],
      subject,
      html,
      replyTo: 'contact@monorganisation.com',
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
            : isCancel
            ? `cancelled — ${new Date().toISOString()}${reason ? ` — ${reason}` : ''}`
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
