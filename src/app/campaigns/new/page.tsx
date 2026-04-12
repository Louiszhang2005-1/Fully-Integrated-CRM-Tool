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
  const [bookingLink, setBookingLink] = useState('https://monorganisation.com/les-visites/');
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
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">New Campaign</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your personalized outreach campaign
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            General Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="campaign-name" className="label">
                Campaign name *
              </label>
              <input
                id="campaign-name"
                type="text"
                className="input"
                placeholder="e.g. Corporate Visits Q1 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="audience-type" className="label">
                Audience type *
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
                  'Target: event managers, HR directors, communications leads'}
                {audienceType === 'ecoles' &&
                  'Target: teachers, school principals, sustainability coordinators'}
                {audienceType === 'institutions' &&
                  'Target: tourism directors, journalists, event agencies'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-limit" className="label">
                  Contact limit *
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
                  Target geography
                </label>
                <input
                  id="geography"
                  type="text"
                  className="input"
                  placeholder="e.g. Montreal, Laval"
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
                    Auto-discovery via Apollo
                    <span className="ml-2 text-xs font-normal text-slate-400">(paid plan required)</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When you start the campaign, it will automatically search for new Apollo contacts if the list is insufficient, enrich them with their emails, then send messages — without manual intervention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Prompt */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">
            AI Message
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            This template will be personalized by AI for each contact. Edit it as needed.
          </p>

          <div>
            <label htmlFor="ai-prompt" className="label">
              Message template
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
              💡 <strong>Tip:</strong> The AI will automatically replace [FirstName] with the contact&apos;s first name and personalize the message based on their role and organization.
            </p>
          </div>
        </div>

        {/* Additional options */}
        <div className="card-elevated p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">
            Additional Options
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="booking-link" className="label">
                Booking link
              </label>
              <input
                id="booking-link"
                type="url"
                className="input"
                placeholder="https://monorganisation.com/les-visites/"
                value={bookingLink}
                onChange={(e) => setBookingLink(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="pdf-url" className="label">
                PDF URL (brochure)
              </label>
              <input
                id="pdf-url"
                type="text"
                className="input"
                placeholder="Link to the PDF brochure"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                The PDF will be attached to emails only (not LinkedIn messages)
              </p>
            </div>

            <div>
              <label htmlFor="keywords" className="label">
                Additional keywords
              </label>
              <textarea
                id="keywords"
                className="textarea"
                rows={2}
                placeholder="e.g. mushrooms, kombucha, green roofs, craft brewery..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                The AI will naturally integrate these keywords into personalized messages
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
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={!name.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Create campaign
          </button>
        </div>
      </form>
    </div>
  );
}
