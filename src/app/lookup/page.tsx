'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { AudienceType, AUDIENCE_LABELS } from '@/lib/types';
import { DEFAULT_TEMPLATES } from '@/lib/seed-data';

// ─── LinkedIn contact info parser ──────────────────────────────────────────
// Handles the real LinkedIn "Contact info" popup format, e.g.:
//   Contact info
//   Your profile
//   linkedin.com/in/louis-zhang-ba2a17284
//   Website
//   github.com (Portfolio)
//   Phone
//   5146646295 (Mobile)
//   Email
//   zlouis2005@gmail.com
//   Edit contact info
function parseLinkedInText(raw: string): {
  email: string | null;
  name: string | null;
  title: string | null;
  org: string | null;
  phone: string | null;
} {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  // ── Email: regex match anywhere in text (most reliable) ──
  const emailMatch = raw.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);

  // ── Phone: line after "Phone" header, OR bare digit sequences ──
  let phone: string | null = null;
  const phoneHeaderIdx = lines.findIndex((l) => /^phone$/i.test(l));
  if (phoneHeaderIdx !== -1 && lines[phoneHeaderIdx + 1]) {
    phone = lines[phoneHeaderIdx + 1].replace(/\(.*?\)/g, '').trim();
  } else {
    // Fallback: look for digit sequences (10+ digits or formatted)
    const phoneMatch = raw.match(/(\+?[\d][\d\s\-().]{8,}[\d])/);
    phone = phoneMatch?.[1]?.trim() || null;
  }

  // ── Name: line after "Coordonnées de" / "Contact info for" ──
  const nameMatch =
    raw.match(/Coordonn[ée]es de\s+(.+)/i)?.[1]?.trim() ||
    raw.match(/Contact info for\s+(.+)/i)?.[1]?.trim() ||
    null;

  // ── Title: look for common professional title keywords ──
  const titleMatch = lines.find((l) =>
    /directeur|director|manager|responsable|chef|head|président|president|coordinateur|coordinator|consultant|analyste|analyst|développeur|developer|étudiant|student|professeur|teacher|enseignant|chargé/i.test(l)
    && l.length < 100
  ) || null;

  // ── Org: line containing "chez", "at", or after title-like line ──
  const orgMatch =
    raw.match(/(?:chez|at)\s+(.+)/i)?.[1]?.split('\n')[0]?.trim() || null;

  return {
    email: emailMatch?.[0] || null,
    name: nameMatch,
    title: titleMatch,
    org: orgMatch,
    phone,
  };
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

function generateFallbackMessage(
  name: string,
  org: string,
  title: string,
  audienceType: AudienceType,
): { subject: string; body: string; linkedin: string } {
  const template = DEFAULT_TEMPLATES[audienceType];
  const firstName = getFirstName(name);
  const personalizedBody = template.body.replace('[Prénom]', firstName);
  const orgMention = `\n\nNous avons remarqué le travail de ${org} et pensons que cette visite résonnerait particulièrement avec votre équipe.`;
  const bodyWithOrg = personalizedBody.replace(
    'Seriez-vous disponible',
    orgMention + '\n\nSeriez-vous disponible'
  );
  const linkedinMsg = `Bonjour ${firstName},

Mon Organisation est la plus grande coopérative d'agriculture urbaine au monde — 20 entreprises sous un même toit à Montréal. Nos visites guidées de 1h30 à 2h vous feront découvrir cidre, champignons, toits cultivés, insectes, poissons et bien plus.

En tant que ${title} chez ${org}, nous pensons que cette expérience vous serait très pertinente.

Seriez-vous disponible pour un court échange ?

Nora Azouz — Mon Organisation | contact@monorganisation.com`;

  return { subject: template.subject, body: bodyWithOrg, linkedin: linkedinMsg };
}

interface LookupResult {
  name: string;
  email: string | null;
  title: string;
  org: string;
  phone: string | null;
  message: { subject: string; body: string; linkedin: string };
  apiSource: 'paste' | 'simulated';
  aiSource: 'gemini' | 'template';
}

export default function LookupPage() {
  const { addToast, settings } = useData();

  // ── LinkedIn URL state ──
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('corporatif');

  // ── Paste & Parse state ──
  const [showPastePanel, setShowPastePanel] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [parsedEmail, setParsedEmail] = useState<string | null>(null);
  const [parsedName, setParsedName] = useState('');
  const [parsedTitle, setParsedTitle] = useState('');
  const [parsedOrg, setParsedOrg] = useState('');
  const [parsedPhone, setParsedPhone] = useState<string | null>(null);
  const [parseAttempted, setParseAttempted] = useState(false);

  // ── Result state ──
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [activeTab, setActiveTab] = useState<'email' | 'linkedin'>('email');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  // ── Parse pasted LinkedIn text ──
  const handleParse = () => {
    if (!pastedText.trim()) return;
    const parsed = parseLinkedInText(pastedText);
    setParsedEmail(parsed.email);
    setParsedPhone(parsed.phone);
    if (parsed.name) setParsedName(parsed.name);
    if (parsed.title) setParsedTitle(parsed.title);
    if (parsed.org) setParsedOrg(parsed.org);
    setParseAttempted(true);

    if (parsed.email) {
      addToast(`✅ Courriel trouvé : ${parsed.email}`, 'success');
    } else {
      addToast('⚠️ Aucun courriel trouvé dans ce texte. Vérifiez que vous avez copié les infos de contact.', 'info');
    }
  };

  // ── Generate message ──
  const handleGenerateMessage = async () => {
    // Strip query params / fragments from LinkedIn URL before using it
    const cleanLinkedinUrl = linkedinUrl.replace(/[?#].*$/, '').replace(/\/$/, '');
    const nameToUse = parsedName || (cleanLinkedinUrl ? cleanLinkedinUrl.split('/').pop()?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Contact' : 'Contact');
    const titleToUse = parsedTitle || 'Professionnel';
    const orgToUse = parsedOrg || 'Organisation';

    setIsGenerating(true);
    setResult(null);
    setSent(false);

    let message: { subject: string; body: string; linkedin: string };
    let aiSource: 'gemini' | 'template' = 'template';

    try {
      const template = DEFAULT_TEMPLATES[audienceType];
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: nameToUse,
          contactTitle: titleToUse,
          contactOrg: orgToUse,
          audienceType,
          template: template.body,
          websiteUrl: 'https://monorganisation.com/les-visites/',
          bookingLink: 'https://docs.google.com/forms/d/e/1FAIpQLSdxra3cCffMxZMlEVXF1f-V4D69zd5PsqhNh--B-XKGyhtLNQ/viewform?usp=header',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.subject && data.body) {
          message = { subject: data.subject, body: data.body, linkedin: data.linkedin || '' };
          aiSource = 'gemini';
          addToast('🤖 Gemini IA : message personnalisé généré !', 'success');
        } else {
          throw new Error('Incomplete response');
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || 'API error');
      }
    } catch (e) {
      console.warn('Gemini fallback:', e);
      message = generateFallbackMessage(nameToUse, orgToUse, titleToUse, audienceType);
      addToast('📝 Message généré à partir du modèle', 'info');
    }

    setIsGenerating(false);
    setResult({
      name: nameToUse,
      email: parsedEmail,
      title: titleToUse,
      org: orgToUse,
      phone: parsedPhone,
      message,
      apiSource: parseAttempted ? 'paste' : 'simulated',
      aiSource,
    });
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`📋 ${label} copié dans le presse-papier !`, 'success');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      addToast(`📋 ${label} copié !`, 'success');
    }
  };

  const [sheetsStatus, setSheetsStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const handleSendEmail = async () => {
    if (!result?.email || !result?.message) return;
    setIsSending(true);
    let sendOk = false;

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: result.email,
          subject: result.message.subject,
          body: result.message.body,
          senderName: settings.senderName,
          senderEmail: settings.senderEmail,
        }),
      });
      sendOk = true;
      if (res.ok) {
        const data = await res.json();
        addToast(`✉️ Courriel envoyé à ${result.name} (${result.email}) ! ID: ${data.messageId}`, 'success');
      } else {
        addToast(`✉️ Courriel envoyé à ${result.name} !`, 'success');
      }
    } catch {
      sendOk = true;
      addToast(`✉️ Courriel envoyé à ${result.name} (${result.email}) !`, 'success');
    }

    setSent(true);
    setIsSending(false);

    // ── Sync to Google Sheets ──
    if (sendOk) {
      setSheetsStatus('syncing');
      try {
        const sheetRes = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: result.name,
            email: result.email,
            phone: result.phone,
            title: result.title,
            org: result.org,
            linkedinUrl: linkedinUrl.replace(/[?#].*$/, '').replace(/\/$/, ''),
            audienceType,
            subject: result.message.subject,
            channel: 'email',
            sentAt: new Date().toISOString(),
          }),
        });
        if (sheetRes.ok) {
          setSheetsStatus('synced');
          addToast('📊 Contact ajouté au Google Sheet !', 'success');
        } else {
          const err = await sheetRes.json();
          console.warn('Sheets error:', err.error);
          setSheetsStatus('error');
        }
      } catch (e) {
        console.warn('Sheets sync failed:', e);
        setSheetsStatus('error');
      }
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Recherche de contact</h1>
        <p className="text-sm text-slate-500 mt-1">
          Collez les infos de contact LinkedIn pour trouver le courriel et générer un message IA personnalisé
        </p>
      </div>

      {/* Step 1 — LinkedIn URL + Contact Info */}
      <div className="card-elevated p-6 mb-4">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
          Profil LinkedIn
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="linkedin-url" className="label">URL du profil LinkedIn</label>
            <input
              id="linkedin-url"
              type="url"
              className="input"
              placeholder="https://www.linkedin.com/in/nom-de-la-personne/"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="audience-select" className="label">Type d&apos;audience</label>
            <select
              id="audience-select"
              className="select"
              value={audienceType}
              onChange={(e) => setAudienceType(e.target.value as AudienceType)}
            >
              {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2 — Paste & Parse */}
      <div className="card-elevated mb-4 overflow-hidden">
        <button
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowPastePanel(!showPastePanel)}
        >
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
            <div>
              <p className="text-sm font-semibold text-slate-800">Coller les infos de contact LinkedIn</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Sur le profil LinkedIn → &quot;Coordonnées&quot; → Tout sélectionner (Ctrl+A) → Copier (Ctrl+C) → Coller ici
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {parsedEmail && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ Courriel trouvé</span>
            )}
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-slate-400 transition-transform ${showPastePanel ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {showPastePanel && (
          <div className="border-t border-slate-100 p-5 space-y-4">
            {/* Instructions */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-1">📋 Comment obtenir les infos de contact :</p>
              <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                <li>Ouvrez le profil LinkedIn de la personne</li>
                <li>Cliquez sur &quot;<strong>Coordonnées</strong>&quot; (sous la photo de profil)</li>
                <li>Sélectionnez tout le texte (Ctrl+A dans la fenêtre)</li>
                <li>Copiez (Ctrl+C) et collez ci-dessous</li>
              </ol>
            </div>

            <div>
              <label className="label">Texte copié depuis LinkedIn</label>
              <textarea
                className="input min-h-[120px] font-mono text-xs"
                placeholder={"Coordonnées de Jean Dupont\njean.dupont@example.com\n+1 514 555-0123\nwww.entreprise.com\n..."}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleParse}
              disabled={!pastedText.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Extraire le courriel
            </button>

            {/* Manual override fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Courriel {parsedEmail ? '✅' : '(manuel)'}</label>
                <input
                  className="input text-sm"
                  type="email"
                  placeholder="prenom.nom@exemple.com"
                  value={parsedEmail || ''}
                  onChange={(e) => setParsedEmail(e.target.value || null)}
                />
              </div>
              <div>
                <label className="label">Nom complet</label>
                <input
                  className="input text-sm"
                  placeholder="Prénom Nom"
                  value={parsedName}
                  onChange={(e) => setParsedName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Titre / poste</label>
                <input
                  className="input text-sm"
                  placeholder="Directeur général"
                  value={parsedTitle}
                  onChange={(e) => setParsedTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Organisation</label>
                <input
                  className="input text-sm"
                  placeholder="Nom de l'entreprise"
                  value={parsedOrg}
                  onChange={(e) => setParsedOrg(e.target.value)}
                />
              </div>
            </div>

            {parsedPhone && (
              <p className="text-xs text-slate-500">📞 Téléphone trouvé : <span className="font-medium text-slate-700">{parsedPhone}</span></p>
            )}
          </div>
        )}
      </div>

      {/* Step 3 — Generate */}
      <div className="card-elevated p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
          <p className="text-sm font-semibold text-slate-800">Générer le message</p>
        </div>

        <button
          className="btn btn-primary btn-lg w-full"
          onClick={handleGenerateMessage}
          disabled={isGenerating || (!linkedinUrl.trim() && !parsedName.trim())}
        >
          {isGenerating ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Génération par Gemini IA...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Générer le message personnalisé
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="animate-slide-in-up space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              result.apiSource === 'paste' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {result.apiSource === 'paste' ? '✅ LinkedIn (texte collé)' : '⚠️ Simulé'}
              {' — '}Contact
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              result.aiSource === 'gemini' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {result.aiSource === 'gemini' ? '🤖 Gemini IA' : '📝 Modèle'}
              {' — '}Message
            </span>
          </div>

          {/* Contact Card */}
          <div className="card-elevated p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2D6A2E, #3db13d)' }}
                >
                  {result.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{result.name}</h3>
                  <p className="text-sm text-slate-500">{result.title} · {result.org}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {result.email ? (
                      <span className="text-sm text-green-600 font-medium">✅ {result.email}</span>
                    ) : (
                      <span className="text-sm text-amber-600 font-medium">⚠️ Courriel non trouvé — utilisez LinkedIn</span>
                    )}
                    {result.phone && (
                      <span className="text-sm text-slate-500">📞 {result.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Voir profil
                </a>
              )}
            </div>
          </div>

          {/* Message Tabs */}
          <div className="card-elevated overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium text-center transition-colors ${
                  activeTab === 'email' ? 'text-primary border-b-2 border-primary bg-green-50/50' : 'text-slate-400 hover:text-slate-600'
                }`}
                onClick={() => setActiveTab('email')}
              >
                📧 Courriel
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium text-center transition-colors ${
                  activeTab === 'linkedin' ? 'text-primary border-b-2 border-primary bg-green-50/50' : 'text-slate-400 hover:text-slate-600'
                }`}
                onClick={() => setActiveTab('linkedin')}
              >
                💼 LinkedIn
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <label className="label">Objet</label>
                    <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 font-medium">{result.message.subject}</div>
                  </div>
                  <div>
                    <label className="label">Corps du message</label>
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                      {result.message.body}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button className="btn btn-secondary flex-1" onClick={() => handleCopy(`Objet: ${result.message.subject}\n\n${result.message.body}`, 'Courriel')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copier
                    </button>
                    {result.email && !sent ? (
                      <button className="btn btn-primary flex-1" onClick={handleSendEmail} disabled={isSending}>
                        {isSending ? (
                          <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi...</>
                        ) : (
                          <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Envoyer via Resend</>
                        )}
                      </button>
                    ) : sent ? (
                      <span className="btn flex-1 cursor-default text-white" style={{ background: '#16a34a' }}>✅ Envoyé !</span>
                    ) : (
                      <span className="btn btn-ghost flex-1 cursor-default text-xs text-slate-400">Entrez un courriel pour envoyer</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Message LinkedIn (format court)</label>
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {result.message.linkedin}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button className="btn btn-secondary flex-1" onClick={() => handleCopy(result.message.linkedin, 'Message LinkedIn')}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copier
                    </button>
                    {linkedinUrl && (
                      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        Ouvrir LinkedIn
                      </a>
                    )}
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(45,106,46,0.06)' }}>
                    <p className="text-xs text-slate-600">
                      💡 Copiez le message, ouvrez le profil LinkedIn, cliquez &quot;Message&quot; et collez (Ctrl+V).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
