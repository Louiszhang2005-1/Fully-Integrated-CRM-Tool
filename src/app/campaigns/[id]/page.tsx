'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { AUDIENCE_LABELS, CAMPAIGN_STATUS_LABELS, STATUS_LABELS } from '@/lib/types';

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCampaign, getContactsByCampaign, runCampaign, pauseCampaign, deleteCampaign, runningCampaigns, contacts, settings } = useData();

  const campaignId = params.id as string;
  const campaign = getCampaign(campaignId);
  const campaignContacts = getContactsByCampaign(campaignId);

  // Also get contacts of same audience type that haven't been assigned
  const availableContacts = contacts.filter(
    (c) => campaign && c.audienceType === campaign.audienceType && !c.campaignId && c.status === 'a_contacter'
  );

  if (!campaign) {
    return (
      <div className="animate-fade-in text-center py-20">
        <h2 className="text-xl font-semibold text-slate-600 mb-2">Campaign not found</h2>
        <p className="text-slate-400 mb-4">This campaign does not exist or has been deleted.</p>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          Back to dashboard
        </button>
      </div>
    );
  }

  const isRunning = runningCampaigns.has(campaign.id);
  const progress = campaign.contactLimit > 0
    ? Math.round((campaign.contactsSent / campaign.contactLimit) * 100)
    : 0;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(campaign.id);
      router.push('/');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button onClick={() => router.push('/')} className="btn btn-ghost btn-sm mb-4">
        ← Back
      </button>

      {/* Demo mode banner */}
      {settings.demoMode && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center gap-3">
          <span className="text-lg">🧪</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Demo mode active</p>
            <p className="text-xs text-amber-700">
              Previews will be sent to <strong>{settings.demoEmail}</strong> — no real contacts will be reached. Disable in Settings to send for real.
            </p>
          </div>
        </div>
      )}

      {/* Campaign Header */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
              <span className={`badge badge-${campaign.status}`}>
                {isRunning && (
                  <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse-subtle mr-1" />
                )}
                {CAMPAIGN_STATUS_LABELS[campaign.status]}
              </span>
              {campaign.autoDiscover && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  🔍 Auto-Apollo
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>🎯 {AUDIENCE_LABELS[campaign.audienceType]}</span>
              {campaign.geography && <span>📍 {campaign.geography}</span>}
              <span>📅 {new Date(campaign.createdAt).toLocaleDateString('fr-CA')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === 'active' || isRunning ? (
              <button className="btn btn-secondary" onClick={() => pauseCampaign(campaign.id)}>
                <IconPause />
                Pause
              </button>
            ) : campaign.status !== 'completed' ? (
              <button className="btn btn-primary" onClick={() => runCampaign(campaign.id)} disabled={isRunning}>
                <IconPlay />
                {campaign.contactsSent > 0 ? 'Resume' : 'Start'}
              </button>
            ) : null}
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>Progress</span>
            <span className="font-semibold">{campaign.contactsSent} / {campaign.contactLimit} contacts</span>
          </div>
          <div className="progress-bar" style={{ height: '12px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: campaign.status === 'completed'
                  ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                  : 'linear-gradient(90deg, #2D6A2E, #3db13d)',
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {progress}% completed · {availableContacts.length} available contacts remaining
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Config card */}
          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Configuration
            </h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Audience</dt>
                <dd className="text-slate-700 font-medium">{AUDIENCE_LABELS[campaign.audienceType]}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Limit</dt>
                <dd className="text-slate-700 font-medium">{campaign.contactLimit} contacts</dd>
              </div>
              <div>
                <dt className="text-slate-400">Geography</dt>
                <dd className="text-slate-700 font-medium">{campaign.geography || '—'}</dd>
              </div>
              {campaign.bookingLink && (
                <div>
                  <dt className="text-slate-400">Booking link</dt>
                  <dd>
                    <a href={campaign.bookingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs break-all">
                      {campaign.bookingLink}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {campaign.autoDiscover && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-0.5">🔍 Auto-discovery enabled</p>
                <p className="text-xs text-blue-600">
                  The campaign will search for contacts via Apollo if the list is insufficient, enrich their emails, then send messages automatically.
                </p>
              </div>
            )}
          </div>

          {/* AI Prompt preview */}
          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Message Template
            </h3>
            <div className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto bg-slate-50 rounded-lg p-3">
              {campaign.aiPrompt?.substring(0, 300)}...
            </div>
          </div>
        </div>

        {/* Contacts table */}
        <div className="lg:col-span-2">
          <div className="card-elevated overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                Contacts ({campaignContacts.length})
              </h3>
              {isRunning && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse-subtle" />
                  Sending in progress...
                </span>
              )}
            </div>

            {campaignContacts.length === 0 ? (
              <div className="empty-state py-12">
                <p className="text-sm text-slate-400">
                  {campaign.status === 'draft'
                    ? 'Start the campaign to begin sending'
                    : 'No contacts sent yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th>Organization</th>
                      <th>Channel</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignContacts.map((contact) => (
                      <tr key={contact.id}>
                        <td>
                          <div>
                            <p className="font-medium text-slate-800">{contact.fullName}</p>
                            <p className="text-xs text-slate-400">{contact.title}</p>
                          </div>
                        </td>
                        <td className="text-slate-600">{contact.organization}</td>
                        <td>
                          <span className={`badge ${contact.channel === 'email' ? 'badge-envoye' : 'badge-en_discussion'}`}>
                            {contact.channel === 'email' ? '📧 Email' : '💼 LinkedIn'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${contact.status}`}>
                            {STATUS_LABELS[contact.status]}
                          </span>
                        </td>
                        <td className="text-xs text-slate-400">
                          {contact.sentAt
                            ? new Date(contact.sentAt).toLocaleDateString('fr-CA')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
