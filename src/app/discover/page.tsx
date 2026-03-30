'use client';

import { useState, useRef } from 'react';
import { useData } from '@/lib/data-context';
import { AudienceType, AUDIENCE_LABELS } from '@/lib/types';

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').replace(/^"|"$/g, '').trim(); });
    return row;
  }).filter((r) => Object.values(r).some((v) => v));
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const val = row[k.toLowerCase()];
    if (val) return val;
  }
  return '';
}

function rowToContact(row: Record<string, string>): DiscoveredContact | null {
  const firstName = pick(row, 'prénom', 'prenom', 'firstname', 'first name', 'first_name');
  const lastName = pick(row, 'nom', 'lastname', 'last name', 'last_name', 'nom de famille');
  const fullName = pick(row, 'nom complet', 'full name', 'fullname', 'name') || `${firstName} ${lastName}`.trim();
  if (!fullName) return null;
  return {
    name: fullName,
    firstName,
    lastName,
    title: pick(row, 'titre', 'title', 'poste', 'position', 'job title'),
    organization: pick(row, 'organisation', 'organization', 'company', 'entreprise', 'compagnie'),
    city: pick(row, 'ville', 'city', 'location'),
    linkedinUrl: pick(row, 'linkedin', 'linkedin url', 'linkedin_url', 'linkedinurl'),
    email: pick(row, 'email', 'courriel', 'e-mail') || null,
    photoUrl: null,
  };
}

const CSV_TEMPLATE_HEADERS = 'Prénom,Nom,Titre,Organisation,Email,LinkedIn,Ville';

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE_HEADERS + '\nMarie,Tremblay,Directrice générale,Mon Org,marie@exemple.com,https://linkedin.com/in/marie,Montréal'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'modele_contacts.csv'; a.click();
  URL.revokeObjectURL(url);
}

interface DiscoveredContact {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  organization: string;
  city: string;
  linkedinUrl: string;
  photoUrl: string | null;
  email: string | null;
}

const AUDIENCE_DESCRIPTIONS: Record<AudienceType, string> = {
  corporatif: 'Directeurs, VP, responsables RH et événements en entreprise',
  ecoles: 'Directeurs d\'école, enseignants, coordonnateurs pédagogiques',
  institutions: 'Journalistes, rédacteurs en chef, directeurs communications',
};

export default function DiscoverPage() {
  const { createContact, contacts, addToast } = useData();

  const [audienceType, setAudienceType] = useState<AudienceType>('corporatif');
  const [location, setLocation] = useState('Montreal, Quebec, Canada');
  const [keywords, setKeywords] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DiscoveredContact[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searched, setSearched] = useState(false);
  const [planLimit, setPlanLimit] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [csvMode, setCsvMode] = useState(false);
  const [csvDragOver, setCsvDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingLinkedins = new Set(contacts.map((c) => c.linkedinUrl).filter(Boolean));

  const handleSearch = async (page = 1) => {
    setIsSearching(true);
    setSearched(true);
    setPlanLimit(false);
    setSelected(new Set());
    if (page === 1) setResults([]);

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceType, location, keywords, page }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'plan_limit') {
          setPlanLimit(true);
        } else {
          addToast(data.error || 'Erreur lors de la recherche', 'error');
        }
        setIsSearching(false);
        return;
      }

      setResults(data.contacts || []);
      setTotalCount(data.totalCount || 0);
      setCurrentPage(data.page || page);
      setTotalPages(data.totalPages || 1);
      setIsDemo(data.isDemo === true);
    } catch {
      addToast('Erreur de connexion à Apollo', 'error');
    }

    setIsSearching(false);
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  };

  const handleAddContacts = () => {
    const toAdd = results.filter((_, i) => selected.has(i));
    let added = 0;
    let skipped = 0;

    for (const c of toAdd) {
      if (c.linkedinUrl && existingLinkedins.has(c.linkedinUrl)) {
        skipped++;
        continue;
      }
      createContact({
        fullName: c.name || `${c.firstName} ${c.lastName}`.trim() || 'Contact inconnu',
        organization: c.organization || '',
        title: c.title || '',
        email: c.email || undefined,
        linkedinUrl: c.linkedinUrl || undefined,
        channel: c.email ? 'email' : 'linkedin',
        status: 'a_contacter',
        audienceType,
      });
      added++;
    }

    if (added > 0) addToast(`${added} contact${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} !`, 'success');
    if (skipped > 0) addToast(`${skipped} contact${skipped > 1 ? 's' : ''} déjà présent${skipped > 1 ? 's' : ''} — ignoré${skipped > 1 ? 's' : ''}`, 'info');
    setSelected(new Set());
  };

  const handleCSVFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      addToast('Fichier invalide — veuillez choisir un fichier .csv', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const parsed = rows.map(rowToContact).filter((c): c is DiscoveredContact => c !== null);
      if (parsed.length === 0) {
        addToast('Aucun contact trouvé dans le fichier. Vérifiez les colonnes.', 'error');
        return;
      }
      setResults(parsed);
      setTotalCount(parsed.length);
      setCurrentPage(1);
      setTotalPages(1);
      setSearched(true);
      setPlanLimit(false);
      setIsDemo(false);
      setSelected(new Set(parsed.map((_, i) => i)));
      addToast(`${parsed.length} contact${parsed.length > 1 ? 's' : ''} importé${parsed.length > 1 ? 's' : ''} depuis le CSV`, 'success');
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Découvrir des contacts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Recherchez des contacts potentiels par type d&apos;audience via Apollo.io
        </p>
      </div>

      {/* Search Panel */}
      <div className="card-elevated p-6 mb-6">
        {/* Audience Tabs */}
        <div className="mb-5">
          <label className="label mb-2">Type d&apos;audience</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(AUDIENCE_LABELS) as AudienceType[]).map((type) => (
              <button
                key={type}
                onClick={() => setAudienceType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  audienceType === type
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary'
                }`}
              >
                {AUDIENCE_LABELS[type]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">{AUDIENCE_DESCRIPTIONS[audienceType]}</p>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
          <div>
            <label className="label">Région / Ville</label>
            <input
              className="input"
              placeholder="Montreal, Quebec, Canada"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Mots-clés supplémentaires <span className="text-slate-400 font-normal">(optionnel)</span></label>
            <input
              className="input"
              placeholder="ex : agriculture, environnement, éducation..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn btn-primary btn-lg w-full sm:w-auto"
          onClick={() => handleSearch(1)}
          disabled={isSearching}
        >
          {isSearching ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Recherche en cours...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Rechercher des contacts
            </>
          )}
        </button>
      </div>

      {/* CSV Import card */}
      <div className="card-elevated p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📂</span>
            <h2 className="text-sm font-semibold text-slate-800">Importer depuis un fichier CSV</h2>
          </div>
          <button
            className="text-xs text-primary hover:underline font-medium"
            onClick={downloadTemplate}
          >
            ↓ Télécharger le modèle
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Colonnes reconnues : <span className="font-medium text-slate-600">Prénom, Nom, Titre, Organisation, Email, LinkedIn, Ville</span>. Compatible avec les exports LinkedIn.
        </p>
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            csvDragOver ? 'border-primary bg-green-50' : 'border-slate-200 hover:border-primary/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true); }}
          onDragLeave={() => setCsvDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setCsvDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleCSVFile(file);
          }}
        >
          <p className="text-sm text-slate-500">Glissez un fichier <strong>.csv</strong> ici ou <span className="text-primary font-medium">parcourir</span></p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVFile(f); e.target.value = ''; }}
          />
        </div>
      </div>

      {/* Plan limit warning */}
      {planLimit && (
        <div className="card-elevated p-6 mb-6 border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 mb-1">Plan Apollo.io insuffisant</p>
              <p className="text-sm text-amber-700">
                La recherche de contacts nécessite un plan payant Apollo.io. Votre clé API actuelle est en plan gratuit qui ne permet que l&apos;enrichissement par URL LinkedIn.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Pour utiliser cette fonctionnalité, mettez à niveau votre compte sur <strong>apollo.io</strong> ou utilisez la page <strong>Recherche contact</strong> pour enrichir des profils un à un via URL LinkedIn.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo mode banner */}
      {isDemo && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          🔑 <strong>Mode démo</strong> — Résultats fictifs pour démonstration. Ajoutez une clé <strong>Apollo</strong> dans Paramètres pour rechercher de vrais contacts.
        </div>
      )}

      {/* Results */}
      {searched && !planLimit && (
        <div>
          {/* Results header */}
          {results.length > 0 && (
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{totalCount.toLocaleString()}</span> contact{totalCount !== 1 ? 's' : ''} {totalPages > 1 ? `— page ${currentPage}/${totalPages}` : ''}
                </p>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {selected.size === results.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              {selected.size > 0 && (
                <button className="btn btn-primary" onClick={handleAddContacts}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Ajouter {selected.size} contact{selected.size > 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* No results */}
          {results.length === 0 && !isSearching && (
            <div className="card-elevated p-12 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-slate-600 font-medium">Aucun contact trouvé</p>
              <p className="text-sm text-slate-400 mt-1">Essayez d&apos;élargir la région ou de modifier les mots-clés</p>
            </div>
          )}

          {/* Contact grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {results.map((contact, idx) => {
              const isSelected = selected.has(idx);
              const alreadyAdded = !!(contact.linkedinUrl && existingLinkedins.has(contact.linkedinUrl));
              const initials = [contact.firstName?.[0], contact.lastName?.[0]].filter(Boolean).join('') || '?';

              return (
                <div
                  key={idx}
                  onClick={() => !alreadyAdded && toggleSelect(idx)}
                  className={`card-elevated p-4 flex items-start gap-3 transition-all ${
                    alreadyAdded
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:shadow-md ' + (isSelected ? 'ring-2 ring-primary bg-green-50/40' : '')
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                    alreadyAdded
                      ? 'border-slate-200 bg-slate-100'
                      : isSelected
                      ? 'border-primary bg-primary'
                      : 'border-slate-300'
                  }`}>
                    {alreadyAdded ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isSelected ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </div>

                  {/* Avatar */}
                  {contact.photoUrl ? (
                    <img src={contact.photoUrl} alt={contact.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2D6A2E, #3db13d)' }}
                    >
                      {initials}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm leading-tight">{contact.name || 'Nom inconnu'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{contact.title}</p>
                        <p className="text-xs text-slate-700 font-medium mt-0.5 truncate">{contact.organization}</p>
                      </div>
                      {alreadyAdded && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Ajouté</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {contact.city && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                          </svg>
                          {contact.city}
                        </span>
                      )}
                      {contact.email && (
                        <span className="text-xs text-green-600 font-medium">✅ Email</span>
                      )}
                      {contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage <= 1 || isSearching}
              >
                ← Précédent
              </button>
              <span className="text-sm text-slate-500">Page {currentPage} / {totalPages}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage >= totalPages || isSearching}
              >
                Suivant →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!searched && (
        <div className="card-elevated p-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(45,106,46,0.1), rgba(61,177,61,0.1))' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D6A2E" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-slate-700 font-semibold mb-1">Trouvez vos prochains contacts</p>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Sélectionnez un type d&apos;audience, ajustez la région et lancez la recherche. Les résultats peuvent être ajoutés directement à vos contacts.
          </p>
        </div>
      )}
    </div>
  );
}
