'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { AudienceType, AUDIENCE_LABELS } from '@/lib/types';
import { DEFAULT_TEMPLATES } from '@/lib/seed-data';

export default function NewCampaignPage() {
  const router = useRouter();
  const { createCampaign } = useData();

  const [name, setName] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('corporatif');
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_TEMPLATES.corporatif.body);
  const [contactLimit, setContactLimit] = useState(25);
  const [bookingLink, setBookingLink] = useState('https://centrale.coop/les-visites/');
  const [geography, setGeography] = useState('Montréal');
  const [pdfUrl, setPdfUrl] = useState('');
  const [autoDiscover, setAutoDiscover] = useState(false);
  const [keywords, setKeywords] = useState('');

  const handleAudienceChange = (type: AudienceType) => {
    setAudienceType(type);
    setAiPrompt(DEFAULT_TEMPLATES[type].body);
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const campaign = createCampaign({
      name: name.trim(),
      audienceType,
      aiPrompt,
      contactLimit,
      bookingLink: bookingLink || undefined,
      geography: geography || undefined,
      pdfUrl: pdfUrl || undefined,
      autoDiscover,
      keywords: keywords.trim() || undefined,
    });

    router.push(`/campaigns/${campaign.id}`);
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm mb-4"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nouvelle campagne</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configurez votre campagne d&apos;outreach personnalisée
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Informations générales
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="campaign-name" className="label">
                Nom de la campagne *
              </label>
              <input
                id="campaign-name"
                type="text"
                className="input"
                placeholder="ex: Visites corporatives Q1 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="audience-type" className="label">
                Type d&apos;audience *
              </label>
              <select
                id="audience-type"
                className="select"
                value={audienceType}
                onChange={(e) => handleAudienceChange(e.target.value as AudienceType)}
              >
                {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {audienceType === 'corporatif' &&
                  'Cible: gestionnaires d\'événements, directeurs RH, communications'}
                {audienceType === 'ecoles' &&
                  'Cible: enseignants, directeurs d\'école, responsables développement durable'}
                {audienceType === 'institutions' &&
                  'Cible: directeurs tourisme, journalistes, agences événementielles'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-limit" className="label">
                  Limite de contacts *
                </label>
                <input
                  id="contact-limit"
                  type="number"
                  className="input"
                  min={1}
                  max={500}
                  value={contactLimit}
                  onChange={(e) => setContactLimit(Number(e.target.value))}
                />
              </div>

              <div>
                <label htmlFor="geography" className="label">
                  Géographie cible
                </label>
                <input
                  id="geography"
                  type="text"
                  className="input"
                  placeholder="ex: Montréal, Laval"
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                />
              </div>
            </div>

            {/* Auto-discover toggle */}
            <div
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                autoDiscover
                  ? 'border-primary bg-green-50/60'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
              onClick={() => setAutoDiscover(!autoDiscover)}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                  autoDiscover ? 'border-primary bg-primary' : 'border-slate-300'
                }`}>
                  {autoDiscover && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Découverte automatique via Apollo
                    <span className="ml-2 text-xs font-normal text-slate-400">(plan payant requis)</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quand vous démarrez la campagne, elle cherchera automatiquement de nouveaux contacts Apollo si la liste est insuffisante, les enrichira avec leurs courriels, puis enverra les messages — sans intervention manuelle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Prompt */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">
            Message IA
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Ce modèle sera personnalisé par l&apos;IA pour chaque contact. Modifiez-le selon vos besoins.
          </p>

          <div>
            <label htmlFor="ai-prompt" className="label">
              Modèle de message
            </label>
            <textarea
              id="ai-prompt"
              className="textarea"
              rows={12}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{ minHeight: '240px' }}
            />
          </div>

          <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(45,106,46,0.06)' }}>
            <p className="text-xs text-slate-600">
              💡 <strong>Conseil:</strong> L&apos;IA remplacera automatiquement [Prénom] par le prénom du contact et personnalisera le message en fonction de son poste et son organisation.
            </p>
          </div>
        </div>

        {/* Additional options */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Options supplémentaires
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="booking-link" className="label">
                Lien de réservation
              </label>
              <input
                id="booking-link"
                type="url"
                className="input"
                placeholder="https://centrale.coop/les-visites/"
                value={bookingLink}
                onChange={(e) => setBookingLink(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="pdf-url" className="label">
                URL du PDF (brochure)
              </label>
              <input
                id="pdf-url"
                type="text"
                className="input"
                placeholder="Lien vers la brochure PDF"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                Le PDF sera joint aux courriels uniquement (pas aux messages LinkedIn)
              </p>
            </div>

            <div>
              <label htmlFor="keywords" className="label">
                Mots-clés additionnels
              </label>
              <textarea
                id="keywords"
                className="textarea"
                rows={2}
                placeholder="ex: champignons, kombucha, toits verts, brasserie artisanale..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                L&apos;IA intégrera ces mots-clés naturellement dans les messages personnalisés
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between py-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.back()}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={!name.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Créer la campagne
          </button>
        </div>
      </form>
    </div>
  );
}
