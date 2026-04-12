import { NextRequest } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, senderName, senderEmail, demoMode, demoEmail, originalRecipient } = await request.json();

    if (!to || !subject || !body) {
      return Response.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // In demo mode: redirect to the test address, never touch the real contact
    const actualTo = demoMode && demoEmail ? demoEmail : to;
    const actualSubject = demoMode
      ? `[DEMO PREVIEW] ${subject}`
      : subject;
    const demoHeader = demoMode
      ? `────────────────────────────────\n⚠️ DEMO PREVIEW — this email would have been sent to:\n${originalRecipient || to}\n────────────────────────────────\n\n`
      : '';
    const actualBody = demoHeader + body;

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return Response.json(
        { error: 'Resend API key not configured. Add RESEND_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);

    // Convert plain text body to basic HTML (preserve line breaks)
    const htmlBody = actualBody
      .split('\n\n')
      .map((paragraph: string) => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    // Use RESEND_FROM_EMAIL env var when the domain is verified in Resend.
    // Until then, falls back to onboarding@resend.dev (Resend test address).
    // To unlock: verify monorganisation.com in Resend → set RESEND_FROM_EMAIL=contact@monorganisation.com
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromField = senderName ? `${senderName} <${fromEmail}>` : `Mon Organisation <${fromEmail}>`;

    const { data, error } = await resend.emails.send({
      from: fromField,
      to: [actualTo],
      subject: actualSubject,
      html: htmlBody,
      replyTo: senderEmail || 'contact@monorganisation.com',
    });

    if (error) {
      console.error('Resend error:', error);
      return Response.json(
        { error: `Email send failed: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      messageId: data?.id,
      to,
      subject,
    });
  } catch (error) {
    console.error('Send error:', error);
    return Response.json(
      { error: 'Internal server error during email send' },
      { status: 500 }
    );
  }
}
