'use client';

import { useState, useMemo, useRef } from 'react';
import { useData } from '@/lib/data-context';
import {
  AudienceType,
  ContactStatus,
  AUDIENCE_LABELS,
  STATUS_LABELS,
  Contact,
} from '@/lib/types';

// ─── CSV import helpers ────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());

  return lines.slice(1).map((line) => {
    // Handle quoted fields that may contain commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function detectField(row: Record<string, string>, candidates: string[]): string {
  for (const key of Object.keys(row)) {
    if (candidates.some((c) => key.toLowerCase().includes(c.toLowerCase()))) {
      return row[key] || '';
    }
  }
  return '';
}

function rowToContactFields(row: Record<string, string>) {
  const firstName = detectField(row, ['first name', 'prénom', 'prenom']);
  const lastName = detectField(row, ['last name', 'nom de famille']);
  const fullName =
    detectField(row, ['nom', 'name', 'full name']) ||
    [firstName, lastName].filter(Boolean).join(' ');
  const email = detectField(row, ['courriel', 'email', 'adresse']);
  const title = detectField(row, ['titre', 'title', 'rôle', 'role', 'poste']);
  const organization = detectField(row, ['organisation', 'organization', 'company', 'entreprise', 'compagnie']);
  const linkedinUrl = detectField(row, ['linkedin']);
  const audienceRaw = detectField(row, ['audience', 'type']);
  const audience = (['corporatif', 'ecoles', 'institutions'].includes(audienceRaw)
    ? audienceRaw
    : null) as AudienceType | null;

  return { fullName, email, title, organization, linkedinUrl, audience };
}

interface ImportPreview {
  rows: ReturnType<typeof rowToContactFields>[];
  filename: string;
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const { contacts, updateContact, createContact, campaigns } = useData();

  const [filterAudience, setFilterAudience] = useState<AudienceType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | 'all'>('all');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ContactStatus | ''>('');

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importAudience, setImportAudience] = useState<AudienceType>('corporatif');
  const [importDone, setImportDone] = useState(0);

  // Sheets sync
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [syncResult, setSyncResult] = useState<{ added: number; skipped: number } | null>(null);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (filterAudience !== 'all' && c.audienceType !== filterAudience) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterCampaign !== 'all' && c.campaignId !== filterCampaign) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.fullName.toLowerCase().includes(s) ||
          c.organization.toLowerCase().includes(s) ||
          c.title.toLowerCase().includes(s) ||
          (c.email && c.email.toLowerCase().includes(s))
        );
      }
      return true;
    });
  }, [contacts, filterAudience, filterStatus, filterCampaign, search]);

  // ── Export CSV ──
  const handleExportCSV = () => {
    const headers = ['Name', 'Organization', 'Title', 'Email', 'LinkedIn', 'Channel', 'Status', 'Audience', 'Follow-up', 'Send Date'];
    const rows = filteredContacts.map((c) => [
      c.fullName,
      c.organization,
      c.title,
      c.email || '',
      c.linkedinUrl || '',
      c.channel,
      STATUS_LABELS[c.status],
      AUDIENCE_LABELS[c.audienceType],
      c.nextContact || '',
      c.sentAt ? new Date(c.sentAt).toLocaleDateString('fr-CA') : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── CSV Import ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text).map(rowToContactFields).filter((r) => r.fullName);
      setImportPreview({ rows, filename: file.name });
      setImportDone(0);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    let added = 0;
    for (const row of importPreview.rows) {
      if (!row.fullName) continue;
      createContact({
        fullName: row.fullName,
        organization: row.organization || '',
        title: row.title || '',
        email: row.email || undefined,
        linkedinUrl: row.linkedinUrl || undefined,
        channel: row.email ? 'email' : 'linkedin',
        status: 'a_contacter',
        audienceType: row.audience || importAudience,
      });
      added++;
    }
    setImportDone(added);
    setImportPreview(null);
  };

  // ── Bulk selection ──
  const allFilteredIds = filteredContacts.map((c) => c.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatusChange = () => {
    if (!bulkStatus) return;
    selectedIds.forEach((id) => updateContact(id, { status: bulkStatus as ContactStatus }));
    setSelectedIds(new Set());
    setBulkStatus('');
  };

  const handleBulkDelete = () => {
    // We don't have a deleteContact yet — update status to ne_pas_contacter as a soft-delete
    selectedIds.forEach((id) => updateContact(id, { status: 'ne_pas_contacter' }));
    setSelectedIds(new Set());
  };

  const handleSyncToSheets = async () => {
    setSyncStatus('syncing');
    setSyncResult(null);
    let added = 0;
    let skipped = 0;

    for (const contact of filteredContacts) {
      // Sent contacts → Envoyés tab (no limit)
      // Prospects      → audience pipeline tab (MVP limit applies)
      const isSent = contact.status === 'envoye' || !!contact.sentAt;
      const target = isSent ? 'sent' : 'pipeline';

      try {
        const res = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target,
            name: contact.fullName,
            email: contact.email,
            title: contact.title,
            org: contact.organization,
            linkedinUrl: contact.linkedinUrl,
            audienceType: contact.audienceType,
            channel: contact.channel,
            sentAt: contact.sentAt,
            status: STATUS_LABELS[contact.status],
          }),
        });
        if (res.ok) {
          added++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    setSyncStatus('done');
    setSyncResult({ added, skipped });
  };

  return (
    <div className="animate-fade-in">
      {/* Import preview modal */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Import contacts</h2>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-medium text-slate-700">{importPreview.rows.length}</span> contacts detected in <em>{importPreview.filename}</em>
            </p>

            {/* Sample preview */}
            <div className="bg-slate-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto text-xs space-y-1">
              {importPreview.rows.slice(0, 5).map((r, i) => (
                <div key={i} className="text-slate-600">
                  <span className="font-medium text-slate-800">{r.fullName}</span>
                  {r.organization && <span> · {r.organization}</span>}
                  {r.email && <span className="text-green-600"> · {r.email}</span>}
                </div>
              ))}
              {importPreview.rows.length > 5 && (
                <p className="text-slate-400">…et {importPreview.rows.length - 5} autres</p>
              )}
            </div>

            <div className="mb-4">
              <label className="label">Type d&apos;audience par défaut</label>
              <p className="text-xs text-slate-400 mb-1">Appliqué aux contacts sans audience détectée dans le CSV</p>
              <select
                className="select"
                value={importAudience}
                onChange={(e) => setImportAudience(e.target.value as AudienceType)}
              >
                {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-primary flex-1" onClick={handleConfirmImport}>
                Importer {importPreview.rows.length} contacts
              </button>
              <button className="btn btn-secondary" onClick={() => setImportPreview(null)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">
            {contacts.length} contacts au total · {filteredContacts.length} affichés
            {importDone > 0 && (
              <span className="ml-2 text-green-600 font-medium">✅ {importDone} importés</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Importer CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSyncToSheets}
            disabled={syncStatus === 'syncing'}
            title="Synchronise les contacts affichés vers Google Sheets (limite MVP: 5 par onglet)"
          >
            {syncStatus === 'syncing' ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                Sync…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {syncResult ? `Sheets (${syncResult.added} ajoutés)` : 'Sync Sheets'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="card-elevated p-3 mb-4 flex items-center gap-3 flex-wrap border border-primary/20 bg-green-50/40">
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.size} contact{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <select
              className="select text-sm"
              style={{ width: 'auto', minWidth: '160px' }}
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ContactStatus)}
            >
              <option value="">Changer le statut…</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleBulkStatusChange}
              disabled={!bulkStatus}
            >
              Appliquer
            </button>
            <button
              className="btn btn-ghost btn-sm text-rose-500 hover:bg-rose-50"
              onClick={handleBulkDelete}
            >
              Marquer à ne pas contacter
            </button>
            <button
              className="btn btn-ghost btn-sm ml-auto"
              onClick={() => setSelectedIds(new Set())}
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-elevated p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              className="input"
              placeholder="🔍 Rechercher un contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value as AudienceType | 'all')}
          >
            <option value="all">Tous les types</option>
            {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ContactStatus | 'all')}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
          >
            <option value="all">Toutes les campagnes</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {filteredContacts.length === 0 ? (
          <div className="empty-state py-12">
            <p className="text-sm text-slate-400">Aucun contact ne correspond à vos filtres</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </th>
                <th>Contact</th>
                <th>Organisation</th>
                <th>Titre / Rôle</th>
                <th>Canal</th>
                <th>Statut</th>
                <th>Relance</th>
                <th>Audience</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact: Contact) => (
                <tr key={contact.id} className={selectedIds.has(contact.id) ? 'bg-green-50/40' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-slate-800">{contact.fullName}</p>
                      {contact.email && (
                        <p className="text-xs text-slate-400">{contact.email}</p>
                      )}
                      {contact.linkedinUrl && !contact.email && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Profil LinkedIn ↗
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="text-slate-600 font-medium">{contact.organization}</td>
                  <td className="text-slate-500 text-xs">{contact.title}</td>
                  <td>
                    <span className={`badge ${contact.channel === 'email' ? 'badge-envoye' : 'badge-en_discussion'}`}>
                      {contact.channel === 'email' ? '📧' : '💼'} {contact.channel === 'email' ? 'Courriel' : 'LinkedIn'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <select
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                        value={contact.status}
                        onChange={(e) =>
                          updateContact(contact.id, { status: e.target.value as ContactStatus })
                        }
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      {contact.status === 'envoye' && (
                        <button
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 whitespace-nowrap"
                          title="Marquer comme ayant répondu"
                          onClick={() => updateContact(contact.id, { status: 'en_discussion' })}
                        >
                          Répondu →
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      type="date"
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-600"
                      value={contact.nextContact || ''}
                      title="Date de relance"
                      onChange={(e) =>
                        updateContact(contact.id, { nextContact: e.target.value || undefined })
                      }
                    />
                  </td>
                  <td>
                    <span className="text-xs text-slate-400">
                      {AUDIENCE_LABELS[contact.audienceType]}
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
        )}
      </div>
    </div>
  );
}
