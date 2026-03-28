'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';

export default function SettingsPage() {
  const { settings, updateSettings, addToast } = useData();

  const [formState, setFormState] = useState(settings);
  const [sheetSetupStatus, setSheetSetupStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleSheetSetup = async () => {
    setSheetSetupStatus('loading');
    try {
      const res = await fetch('/api/sheets/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSheetSetupStatus('done');
        addToast(`✅ Google Sheet configuré — onglets: Corporatif, Écoles, Institutions & Médias`, 'success');
      } else {
        setSheetSetupStatus('error');
        addToast(`Erreur : ${data.error}`, 'error');
      }
    } catch {
      setSheetSetupStatus('error');
      addToast('Erreur de connexion à Google Sheets', 'error');
    }
  };

  const handleSave = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateSettings(formState);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configurez vos intégrations et préférences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sender Identity */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(45,106,46,0.1)' }}>
              👤
            </span>
            Identité de l&apos;expéditeur
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Nom de l&apos;expéditeur</label>
                <input
                  className="input"
                  value={formState.senderName}
                  onChange={(e) => handleChange('senderName', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Courriel de l&apos;expéditeur</label>
                <input
                  className="input"
                  type="email"
                  value={formState.senderEmail}
                  onChange={(e) => handleChange('senderEmail', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Signature</label>
              <textarea
                className="textarea"
                rows={3}
                value={formState.signature}
                onChange={(e) => handleChange('signature', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(139,92,246,0.1)' }}>
              🤖
            </span>
            Intelligence artificielle
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Fournisseur IA</label>
              <select
                className="select"
                value={formState.aiProvider}
                onChange={(e) => handleChange('aiProvider', e.target.value)}
              >
                <option value="claude">Anthropic Claude</option>
                <option value="openai">OpenAI GPT-4</option>
              </select>
            </div>
            <div>
              <label className="label">Clé API IA</label>
              <input
                className="input"
                type="password"
                placeholder="sk-..."
                value={formState.aiApiKey}
                onChange={(e) => handleChange('aiApiKey', e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                {formState.aiProvider === 'claude'
                  ? 'Nécessite une clé API Anthropic'
                  : 'Nécessite une clé API OpenAI'}
              </p>
            </div>
          </div>
        </div>

        {/* Email Service */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(59,130,246,0.1)' }}>
              📧
            </span>
            Service d&apos;envoi de courriels (Resend)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Clé API Resend</label>
              <input
                className="input"
                type="password"
                placeholder="re_..."
                value={formState.sendgridKey}
                onChange={(e) => handleChange('sendgridKey', e.target.value)}
              />
            </div>

            {/* Domain verification guide */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <p className="text-sm font-semibold text-amber-800">
                  Domaine non vérifié — les courriels partent de <code className="text-xs bg-amber-100 px-1 rounded">onboarding@resend.dev</code>
                </p>
              </div>
              <p className="text-xs text-amber-700">
                Jusqu&apos;à ce que <strong>centrale.coop</strong> soit vérifié dans Resend, les destinataires voient l&apos;adresse de test. Les réponses arrivent quand même à <strong>{formState.senderEmail}</strong> grâce au reply-to.
              </p>
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-2">Pour envoyer depuis {formState.senderEmail} :</p>
                <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
                  <li>Connectez-vous à <strong>resend.com</strong> → Domains → <em>Add Domain</em></li>
                  <li>Entrez <strong>centrale.coop</strong> et ajoutez les enregistrements DNS fournis</li>
                  <li>Cliquez <em>Verify</em> — la vérification prend 1 à 24 h</li>
                  <li>
                    Dans votre fichier <code className="bg-amber-100 px-1 rounded">.env.local</code>, ajoutez :
                    <div className="mt-1 bg-amber-100 rounded p-2 font-mono text-xs text-amber-900 select-all">
                      RESEND_FROM_EMAIL={formState.senderEmail}
                    </div>
                  </li>
                  <li>Redémarrez le serveur Next.js</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Apollo.io */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(16,185,129,0.1)' }}>
              🔍
            </span>
            Apollo.io (recherche de contacts)
          </h2>
          <div>
            <label className="label">Clé API Apollo.io</label>
            <input
              className="input"
              type="password"
              placeholder="Votre clé API Apollo.io"
              value={formState.apolloKey}
              onChange={(e) => handleChange('apolloKey', e.target.value)}
            />
          </div>
        </div>

        {/* Google Sheets */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(16,185,129,0.1)' }}>
              📊
            </span>
            Google Sheets
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">ID du Google Sheet</label>
              <input
                className="input"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={formState.googleSheetId}
                onChange={(e) => handleChange('googleSheetId', e.target.value)}
              />
            </div>
            <button
              type="button"
              className={`btn ${formState.googleConnected ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => {
                handleChange('googleConnected', !formState.googleConnected);
                addToast(
                  formState.googleConnected
                    ? 'Google Sheets déconnecté'
                    : 'Google Sheets connecté (mode démo)',
                  'info'
                );
              }}
            >
              {formState.googleConnected ? '✅ Connecté' : 'Connecter Google Sheets'}
            </button>

            {/* One-time sheet structure setup */}
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Initialiser la structure du Google Sheet</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crée trois onglets (<strong>Corporatif</strong>, <strong>Écoles</strong>, <strong>Institutions &amp; Médias</strong>) avec en-têtes, colonnes formatées, lignes gelées et menu déroulant de statut. À exécuter une seule fois.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSheetSetup}
                disabled={sheetSetupStatus === 'loading'}
              >
                {sheetSetupStatus === 'loading' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    Configuration en cours…
                  </>
                ) : sheetSetupStatus === 'done' ? (
                  '✅ Feuille configurée'
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Initialiser les onglets
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* LinkedIn */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(59,130,246,0.1)' }}>
              💼
            </span>
            LinkedIn
          </h2>
          <button
            type="button"
            className={`btn ${formState.linkedinConnected ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => {
              handleChange('linkedinConnected', !formState.linkedinConnected);
              addToast(
                formState.linkedinConnected
                  ? 'LinkedIn déconnecté'
                  : 'LinkedIn connecté (mode démo)',
                'info'
              );
            }}
          >
            {formState.linkedinConnected ? '✅ Connecté' : 'Connecter LinkedIn'}
          </button>
          <p className="text-xs text-slate-400 mt-2">
            Permet l&apos;envoi de messages LinkedIn comme canal secondaire
          </p>
        </div>

        {/* Demo Mode */}
        <div className={`card-elevated p-6 transition-all ${formState.demoMode ? 'ring-2 ring-amber-400' : ''}`}>
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(245,158,11,0.1)' }}>
              🧪
            </span>
            Mode démo
            {formState.demoMode && (
              <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Actif</span>
            )}
          </h2>
          <div className="space-y-4">
            <div
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                formState.demoMode
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => handleChange('demoMode', !formState.demoMode)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                  formState.demoMode ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                }`}>
                  {formState.demoMode && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Rediriger tous les envois vers mon adresse</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aucun email n&apos;est envoyé aux vrais contacts. Vous recevez un aperçu avec &ldquo;[APERÇU DÉMO]&rdquo; en objet et une note indiquant le destinataire original. Les contacts ne sont pas marqués comme envoyés.
                  </p>
                </div>
              </div>
            </div>

            {formState.demoMode && (
              <div>
                <label className="label">Votre adresse de réception des aperçus</label>
                <input
                  className="input"
                  type="email"
                  placeholder="votre@email.com"
                  value={formState.demoEmail}
                  onChange={(e) => handleChange('demoEmail', e.target.value)}
                />
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  ⚠️ Mode démo actif — aucun email ne partira aux contacts réels tant que cette option est activée.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Defaults */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(245,158,11,0.1)' }}>
              ⚙️
            </span>
            Valeurs par défaut
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Lien de réservation par défaut</label>
              <input
                className="input"
                value={formState.defaultBookingLink}
                onChange={(e) => handleChange('defaultBookingLink', e.target.value)}
              />
            </div>
            <div>
              <label className="label">URL du PDF brochure par défaut</label>
              <input
                className="input"
                placeholder="URL vers le fichier PDF"
                value={formState.defaultPdfUrl}
                onChange={(e) => handleChange('defaultPdfUrl', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pb-8">
          <button type="submit" className="btn btn-primary btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sauvegarder les paramètres
          </button>
        </div>
      </form>
    </div>
  );
}
