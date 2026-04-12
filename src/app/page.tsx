'use client';

import Link from 'next/link';
import { useData } from '@/lib/data-context';
import { AUDIENCE_LABELS, CAMPAIGN_STATUS_LABELS } from '@/lib/types';

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

function IconMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export default function DashboardPage() {
  const { campaigns, stats, runCampaign, pauseCampaign, runningCampaigns } = useData();

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your outreach campaigns
          </p>
        </div>
        <Link href="/campaigns/new" className="btn btn-primary btn-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sent this month
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(45,106,46,0.1)', color: '#2D6A2E' }}>
              <IconMail />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.totalSentThisMonth}</p>
          <p className="text-xs text-slate-400 mt-1">messages sent</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              By email
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
              <IconMail />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.emailCount}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              <IconLinkedIn />
            </div>
            <span className="text-xs text-slate-400">{stats.linkedinCount} via LinkedIn</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Response rate
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              <IconTrendUp />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.responseRate}%</p>
          <p className="text-xs text-slate-400 mt-1">in discussion or confirmed</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active campaigns
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <IconZap />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.activeCampaigns}</p>
          <p className="text-xs text-slate-400 mt-1">
            {campaigns.length} campaigns total
          </p>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Campaigns</h2>
        <span className="text-sm text-slate-400">{campaigns.length} campaigns</span>
      </div>

      {campaigns.length === 0 ? (
        <div className="empty-state card-elevated">
          <IconUsers />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            No campaigns
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Create your first outreach campaign to get started.
          </p>
          <Link href="/campaigns/new" className="btn btn-primary">
            Create a campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {campaigns.map((campaign) => {
            const isRunning = runningCampaigns.has(campaign.id);
            const progress = campaign.contactLimit > 0
              ? Math.round((campaign.contactsSent / campaign.contactLimit) * 100)
              : 0;

            return (
              <div key={campaign.id} className="card-elevated p-5 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-base font-semibold text-slate-800 hover:text-primary transition-colors truncate block"
                    >
                      {campaign.name}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {AUDIENCE_LABELS[campaign.audienceType]}
                    </span>
                  </div>
                  <span className={`badge badge-${campaign.status} ml-2 shrink-0`}>
                    {isRunning && (
                      <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse-subtle mr-1" />
                    )}
                    {CAMPAIGN_STATUS_LABELS[campaign.status]}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{campaign.contactsSent} sent</span>
                    <span>{campaign.contactLimit} limit</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progress}%`,
                        background: campaign.status === 'completed'
                          ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                          : campaign.status === 'active'
                          ? 'linear-gradient(90deg, #2D6A2E, #3db13d)'
                          : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                      }}
                    />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                  {campaign.geography && (
                    <span className="flex items-center gap-1">
                      📍 {campaign.geography}
                    </span>
                  )}
                  <span>
                    {new Date(campaign.createdAt).toLocaleDateString('fr-CA')}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-auto flex items-center gap-2">
                  {campaign.status === 'active' || isRunning ? (
                    <button
                      className="btn btn-secondary btn-sm flex-1"
                      onClick={() => pauseCampaign(campaign.id)}
                    >
                      <IconPause />
                      Pause
                    </button>
                  ) : campaign.status !== 'completed' ? (
                    <button
                      className="btn btn-primary btn-sm flex-1"
                      onClick={() => runCampaign(campaign.id)}
                      disabled={isRunning}
                    >
                      <IconPlay />
                      {campaign.contactsSent > 0 ? 'Resume' : 'Start'}
                    </button>
                  ) : (
                    <span className="btn btn-ghost btn-sm flex-1 cursor-default">
                      ✅ Completed
                    </span>
                  )}
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
