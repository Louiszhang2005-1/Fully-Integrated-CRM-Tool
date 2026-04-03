'use client';

import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/lib/data-context';
import {
  BookingRequest,
  VISIT_TYPE_LABELS,
  GROUP_TYPE_LABELS,
  CULINARY_FORMULA_LABELS,
  CulinaryFormula,
  GroupType,
  VisitType,
} from '@/lib/types';

// ─── Revenue helper ───────────────────────────────────────────────────────────

const CULINARY_PER_PERSON: Record<CulinaryFormula, number> = {
  none: 0,
  decouverte: 12,
  degustation: 10,
  boite_lunch: 21,
  buffet: 30,
  cocktail: 47.5,
};

function computeRevenue(b: BookingRequest): number {
  const base = b.groupType === 'corporatif' ? 450 : 300;
  const extra = b.nbPeople > 20
    ? (b.groupType === 'corporatif' ? (b.nbPeople - 20) * 22.5 : (b.nbPeople - 20) * 15)
    : 0;
  const culinary = CULINARY_PER_PERSON[b.culinaryFormula as CulinaryFormula] * b.nbPeople;
  return base + extra + culinary;
}

function fmtDate(iso: string): string {
  if (!iso) return '—';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCurrency(n: number): string {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
}

function getBookingStatus(b: BookingRequest): 'pending' | 'accepted' | 'refused' | 'cancelled' {
  const r = (b.adminResponse || '').toLowerCase();
  if (r.startsWith('accepted')) return 'accepted';
  if (r.startsWith('refused')) return 'refused';
  if (r.startsWith('cancelled')) return 'cancelled';
  return 'pending';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'pending' | 'accepted' | 'refused' | 'cancelled' }) {
  if (status === 'accepted') return <span className="badge badge-confirme">✅ Confirmé</span>;
  if (status === 'refused') return <span className="badge badge-refuse">❌ Refusé</span>;
  if (status === 'cancelled') return <span className="badge badge-refuse">Annulé</span>;
  return <span className="badge badge-a_contacter">⏳ En attente</span>;
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  bookings,
  onDaySelect,
  selectedDay,
}: {
  bookings: BookingRequest[];
  onDaySelect: (date: string) => void;
  selectedDay: string | null;
}) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const acceptedDates = new Set(
    bookings
      .filter((b) => getBookingStatus(b) === 'accepted')
      .map((b) => b.preferredDate.substring(0, 10))
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const monthLabel = new Date(year, month, 1).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="card-elevated p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <button className="btn btn-ghost btn-sm" onClick={prevMonth}>←</button>
        <span className="text-base font-semibold text-slate-700 capitalize">{monthLabel}</span>
        <button className="btn btn-ghost btn-sm" onClick={nextMonth}>→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'].map((d) => (
          <div key={d} className="text-sm text-slate-400 font-semibold py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasEvent = acceptedDates.has(iso);
          const isSelected = selectedDay === iso;
          const isToday = new Date().toISOString().substring(0, 10) === iso;
          return (
            <button
              key={iso}
              onClick={() => onDaySelect(isSelected ? '' : iso)}
              className={`text-sm rounded-lg py-3 font-medium transition-colors relative ${
                isSelected
                  ? 'bg-primary text-white'
                  : isToday
                  ? 'bg-green-100 text-primary'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = 'demandes' | 'calendrier' | 'resume';

export default function BookingsPage() {
  const { settings, addToast } = useData();

  const [tab, setTab] = useState<TabId>('demandes');
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [acceptTarget, setAcceptTarget] = useState<BookingRequest | null>(null);
  const [refuseTarget, setRefuseTarget] = useState<BookingRequest | null>(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<BookingRequest | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [responding, setResponding] = useState(false);

  // Calendar
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Résumé month navigation
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const prevResumeMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextResumeMonth = () => {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const resumeMonthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });
  const isCurrentMonth = viewYear === new Date().getFullYear() && viewMonth === new Date().getMonth();

  const fetchBookings = useCallback(async () => {
    if (!settings.bookingSheetId) {
      setError('Aucun Google Sheet de réservation configuré. Ajoutez l\'ID dans Paramètres → Réservations.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        sheetId: settings.bookingSheetId,
        tabName: settings.bookingFormTab || 'Réponses au formulaire 1',
      });
      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [settings.bookingSheetId, settings.bookingFormTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleRespond = async (action: 'accept' | 'refuse', booking: BookingRequest) => {
    setResponding(true);
    try {
      const res = await fetch('/api/bookings/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: booking.rowIndex,
          action,
          reason: action === 'refuse' ? refuseReason : undefined,
          booking,
          sheetId: settings.bookingSheetId,
          tabName: settings.bookingFormTab,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      addToast(
        action === 'accept'
          ? `✅ Confirmation envoyée à ${booking.fullName}`
          : `✉️ Refus envoyé à ${booking.fullName}`,
        'success'
      );
      // Optimistically update local state so UI reflects change immediately
      const stamp = new Date().toISOString();
      setBookings((prev) =>
        prev.map((bk) =>
          bk.id === booking.id
            ? {
                ...bk,
                adminResponse:
                  action === 'accept'
                    ? `accepted — ${stamp}`
                    : action === 'cancel'
                    ? `cancelled — ${stamp}${cancelReason ? ` — ${cancelReason}` : ''}`
                    : `refused — ${stamp}${refuseReason ? ` — ${refuseReason}` : ''}`,
              }
            : bk
        )
      );
      setAcceptTarget(null);
      setRefuseTarget(null);
      setRefuseReason('');
      setCancelTarget(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      addToast(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`, 'error');
    } finally {
      setResponding(false);
    }
  };

  // Derived data for Résumé tab
  const accepted = bookings.filter((b) => getBookingStatus(b) === 'accepted');
  const now = new Date();
  const startOfMonth = new Date(viewYear, viewMonth, 1);
  const endOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const thisMonthAccepted = accepted.filter((b) => {
    const match = b.preferredDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return false;
    const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    return d >= startOfMonth && d <= endOfMonth;
  });

  const totalPeopleMonth = thisMonthAccepted.reduce((s, b) => s + b.nbPeople, 0);
  const totalRevenueMonth = thisMonthAccepted.reduce((s, b) => s + computeRevenue(b), 0);

  // This week
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  const parseDate = (iso: string) => {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])) : new Date(iso);
  };
  const thisWeekAccepted = accepted
    .filter((b) => {
      const d = parseDate(b.preferredDate);
      return d >= startOfWeek && d <= endOfWeek;
    })
    .sort((a, b) => parseDate(a.preferredDate).getTime() - parseDate(b.preferredDate).getTime());

  // By visit type
  const visitTypeCounts = Object.keys(VISIT_TYPE_LABELS).map((vt) => ({
    type: vt as VisitType,
    label: VISIT_TYPE_LABELS[vt as VisitType],
    count: accepted.filter((b) => b.visitType === vt).length,
  }));
  const maxVisitCount = Math.max(...visitTypeCounts.map((v) => v.count), 1);

  // By group type
  const groupTypeCounts = Object.keys(GROUP_TYPE_LABELS).map((gt) => ({
    type: gt as GroupType,
    label: GROUP_TYPE_LABELS[gt as GroupType],
    count: accepted.filter((b) => b.groupType === gt).length,
  }));

  // Sidebar quick stats (Demandes tab)
  const pending = bookings.filter((b) => getBookingStatus(b) === 'pending');
  const refused = bookings.filter((b) => getBookingStatus(b) === 'refused');
  const cancelled = bookings.filter((b) => getBookingStatus(b) === 'cancelled');
  const totalRevenue = accepted.reduce((s, b) => s + computeRevenue(b), 0);
  const nextBooking = accepted
    .filter((b) => parseDate(b.preferredDate) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => parseDate(a.preferredDate).getTime() - parseDate(b.preferredDate).getTime())[0] || null;

  // Calendar day events
  const dayEvents = selectedDay
    ? bookings.filter(
        (b) =>
          getBookingStatus(b) === 'accepted' &&
          b.preferredDate.substring(0, 10) === selectedDay
      )
    : [];

  return (
    <div className="animate-fade-in">
      {/* Accept modal */}
      {acceptTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Confirmer la réservation</h2>
            <p className="text-sm text-slate-500 mb-4">
              Envoyer une confirmation à <strong>{acceptTarget.fullName}</strong> ({acceptTarget.email})
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-slate-700 space-y-1 mb-5">
              <p>📅 <strong>Date :</strong> {fmtDate(acceptTarget.preferredDate)}</p>
              <p>👥 <strong>Groupe :</strong> {acceptTarget.nbPeople} pers. · {GROUP_TYPE_LABELS[acceptTarget.groupType as GroupType]}</p>
              <p>🌿 <strong>Visite :</strong> {VISIT_TYPE_LABELS[acceptTarget.visitType as VisitType]}</p>
              {acceptTarget.culinaryFormula !== 'none' && (
                <p>🍽️ <strong>Culinaire :</strong> {CULINARY_FORMULA_LABELS[acceptTarget.culinaryFormula as CulinaryFormula]}</p>
              )}
              <p className="pt-1 font-semibold text-green-700">Revenu estimé : {fmtCurrency(computeRevenue(acceptTarget))}</p>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Un courriel de confirmation sera envoyé avec l&apos;adresse, la date, et le lien vers centrale.coop/les-visites/
            </p>
            <div className="flex gap-3">
              <button
                className="btn btn-primary flex-1"
                onClick={() => handleRespond('accept', acceptTarget)}
                disabled={responding}
              >
                {responding ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : '✅ Envoyer la confirmation'}
              </button>
              <button className="btn btn-secondary" onClick={() => setAcceptTarget(null)} disabled={responding}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refuse modal */}
      {refuseTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Refuser la demande</h2>
            <p className="text-sm text-slate-500 mb-4">
              Envoyer un refus à <strong>{refuseTarget.fullName}</strong> ({refuseTarget.email})
            </p>
            <div className="mb-4">
              <label className="label">Raison du refus (optionnel)</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="ex: La date demandée n'est pas disponible. Nous vous invitons à choisir une autre date."
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="btn btn-danger flex-1"
                onClick={() => handleRespond('refuse', refuseTarget)}
                disabled={responding}
              >
                {responding ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : '✉️ Envoyer le refus'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setRefuseTarget(null); setRefuseReason(''); }} disabled={responding}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card-elevated p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Annuler la réservation</h2>
            <p className="text-sm text-slate-500 mb-4">
              Envoyer un avis d&apos;annulation à <strong>{cancelTarget.fullName}</strong> ({cancelTarget.email})
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1 mb-5">
              <p>📅 <strong>Date :</strong> {fmtDate(cancelTarget.preferredDate)}</p>
              <p>👥 <strong>Groupe :</strong> {cancelTarget.nbPeople} pers. · {GROUP_TYPE_LABELS[cancelTarget.groupType as GroupType]}</p>
              <p className="pt-1 font-semibold text-slate-500 line-through">Revenu perdu : {fmtCurrency(computeRevenue(cancelTarget))}</p>
            </div>
            <div className="mb-4">
              <label className="label">Raison de l&apos;annulation (optionnel)</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="ex: Un imprévu nous oblige à annuler cette date. Nous vous invitons à nous recontacter pour planifier une nouvelle visite."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="btn btn-danger flex-1"
                onClick={() => handleRespond('cancel', cancelTarget)}
                disabled={responding}
              >
                {responding ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : 'Envoyer l\'avis d\'annulation'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setCancelTarget(null); setCancelReason(''); }} disabled={responding}>
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Réservations</h1>
          <p className="text-sm text-slate-500 mt-1">
            {bookings.length} demandes · {accepted.length} confirmées
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchBookings}
          disabled={loading}
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          )}
          Rafraîchir
        </button>
      </div>

      {/* Revenue stat bar */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Revenu total confirmé</p>
            <p className="text-2xl font-bold text-green-700">{fmtCurrency(totalRevenue)}</p>
            <p className="text-xs text-slate-400 mt-1">{accepted.length} visite{accepted.length !== 1 ? 's' : ''} confirmée{accepted.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
            <p className="text-xs text-slate-400 mt-1">demande{pending.length !== 1 ? 's' : ''} à traiter</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Ce mois-ci</p>
            <p className="text-2xl font-bold text-slate-900">{fmtCurrency(totalRevenueMonth)}</p>
            <p className="text-xs text-slate-400 mt-1">{thisMonthAccepted.length} visite{thisMonthAccepted.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Personnes totales</p>
            <p className="text-2xl font-bold text-slate-900">{accepted.reduce((s, b) => s + b.nbPeople, 0)}</p>
            <p className="text-xs text-slate-400 mt-1">participants confirmés</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
        {(['demandes', 'calendrier', 'resume'] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'demandes' && '📋 Demandes'}
            {t === 'calendrier' && '📅 Calendrier'}
            {t === 'resume' && '📊 Résumé'}
          </button>
        ))}
      </div>

      {/* Error / no config state */}
      {error && (
        <div className="card-elevated p-5 mb-6 border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800 font-medium">⚠️ {error}</p>
          {!settings.bookingSheetId && (
            <p className="text-xs text-amber-700 mt-1">
              Allez dans <strong>Paramètres → Réservations</strong> pour configurer votre Google Sheet.
            </p>
          )}
        </div>
      )}

      {/* ── Tab: Demandes ── */}
      {tab === 'demandes' && (
        <div className="flex gap-6 items-start">
          {/* Main bookings list */}
          <div className="flex-1 min-w-0 space-y-6">
          {loading && (
            <div className="text-center py-12 text-slate-400 text-sm">Chargement des demandes…</div>
          )}
          {!loading && !error && bookings.length === 0 && (
            <div className="empty-state py-16">
              <p className="text-sm text-slate-400">Aucune demande de réservation trouvée</p>
              <p className="text-xs text-slate-400 mt-1">
                Vérifiez que votre Google Sheet est configuré dans Paramètres.
              </p>
            </div>
          )}
          {/* En attente */}
          {bookings.filter(b => getBookingStatus(b) === 'pending').length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-700 mb-3">
                ⏳ En attente ({bookings.filter(b => getBookingStatus(b) === 'pending').length})
              </h2>
              <div className="space-y-3">
                {bookings.filter(b => getBookingStatus(b) === 'pending').map((b) => {
                  const rev = computeRevenue(b);
                  return (
                    <div key={b.id} className="card-elevated p-5 border-l-4 border-amber-400">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{b.fullName}</h3>
                            <span className="text-sm text-slate-500">{b.organization}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                            <span>📅 {fmtDate(b.preferredDate)}</span>
                            <span>👥 {b.nbPeople} personnes</span>
                            <span>🎯 {GROUP_TYPE_LABELS[b.groupType as GroupType] || b.groupType}</span>
                            <span>🌿 {VISIT_TYPE_LABELS[b.visitType as VisitType] || b.visitType}</span>
                            {b.culinaryFormula !== 'none' && (
                              <span>🍽️ {CULINARY_FORMULA_LABELS[b.culinaryFormula as CulinaryFormula]}</span>
                            )}
                            <span className="font-semibold text-green-700">≈ {fmtCurrency(rev)}</span>
                          </div>
                          {b.notes && <p className="text-xs text-slate-400 mt-2 italic">{b.notes}</p>}
                          {b.email && <p className="text-xs text-slate-400 mt-1">{b.email}{b.phone && ` · ${b.phone}`}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-primary btn-sm" onClick={() => setAcceptTarget(b)}>✅ Accepter</button>
                          <button className="btn btn-danger btn-sm" onClick={() => { setRefuseTarget(b); setRefuseReason(''); }}>❌ Refuser</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Confirmés */}
          {bookings.filter(b => getBookingStatus(b) === 'accepted').length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-green-700 mb-3">
                ✅ Confirmés ({bookings.filter(b => getBookingStatus(b) === 'accepted').length})
              </h2>
              <div className="space-y-3">
                {bookings.filter(b => getBookingStatus(b) === 'accepted').map((b) => {
                  const rev = computeRevenue(b);
                  return (
                    <div key={b.id} className="card-elevated p-5 border-l-4 border-green-400">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{b.fullName}</h3>
                            <span className="text-sm text-slate-500">{b.organization}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                            <span>📅 {fmtDate(b.preferredDate)}</span>
                            <span>👥 {b.nbPeople} personnes</span>
                            <span>🎯 {GROUP_TYPE_LABELS[b.groupType as GroupType] || b.groupType}</span>
                            <span>🌿 {VISIT_TYPE_LABELS[b.visitType as VisitType] || b.visitType}</span>
                            {b.culinaryFormula !== 'none' && (
                              <span>🍽️ {CULINARY_FORMULA_LABELS[b.culinaryFormula as CulinaryFormula]}</span>
                            )}
                            <span className="font-semibold text-green-700">≈ {fmtCurrency(rev)}</span>
                          </div>
                          {b.notes && <p className="text-xs text-slate-400 mt-2 italic">{b.notes}</p>}
                          {b.email && <p className="text-xs text-slate-400 mt-1">{b.email}{b.phone && ` · ${b.phone}`}</p>}
                        </div>
                        <button
                          className="btn btn-secondary btn-sm flex-shrink-0"
                          onClick={() => { setCancelTarget(b); setCancelReason(''); }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Refusés */}
          {bookings.filter(b => getBookingStatus(b) === 'refused').length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-red-600 mb-3">
                ❌ Refusés ({bookings.filter(b => getBookingStatus(b) === 'refused').length})
              </h2>
              <div className="space-y-3">
                {bookings.filter(b => getBookingStatus(b) === 'refused').map((b) => {
                  const rev = computeRevenue(b);
                  return (
                    <div key={b.id} className="card-elevated p-5 border-l-4 border-red-300 opacity-75">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-700">{b.fullName}</h3>
                          <span className="text-sm text-slate-400">{b.organization}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                          <span>📅 {fmtDate(b.preferredDate)}</span>
                          <span>👥 {b.nbPeople} personnes</span>
                          <span>🌿 {VISIT_TYPE_LABELS[b.visitType as VisitType] || b.visitType}</span>
                          <span>≈ {fmtCurrency(rev)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Annulés */}
          {cancelled.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Annulées ({cancelled.length})
              </h2>
              <div className="space-y-3">
                {cancelled.map((b) => {
                  const rev = computeRevenue(b);
                  return (
                    <div key={b.id} className="card-elevated p-5 border-l-4 border-slate-300 opacity-60">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-semibold text-slate-500 line-through">{b.fullName}</h3>
                          <span className="text-sm text-slate-400">{b.organization}</span>
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Annulé</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                          <span>📅 {fmtDate(b.preferredDate)}</span>
                          <span>👥 {b.nbPeople} personnes</span>
                          <span>🌿 {VISIT_TYPE_LABELS[b.visitType as VisitType] || b.visitType}</span>
                          <span className="line-through">≈ {fmtCurrency(rev)}</span>
                        </div>
                        {b.email && <p className="text-xs text-slate-400 mt-1">{b.email}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
          {/* Right sidebar */}
          <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0 sticky top-6">
            {/* Status summary */}
            <div className="card-elevated p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Aperçu</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">⏳ En attente</span>
                  <span className="text-sm font-bold text-amber-600">{pending.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">✅ Confirmées</span>
                  <span className="text-sm font-bold text-green-700">{accepted.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">❌ Refusées</span>
                  <span className="text-sm font-bold text-slate-400">{refused.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Annulées</span>
                  <span className="text-sm font-bold text-slate-400">{cancelled.length}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">💰 Revenus totaux</span>
                    <span className="text-sm font-bold text-green-700">{fmtCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Next booking */}
            {nextBooking && (
              <div className="card-elevated p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Prochaine visite</h3>
                <p className="font-semibold text-slate-900 text-sm">{nextBooking.fullName}</p>
                <p className="text-xs text-slate-500 mb-2">{nextBooking.organization}</p>
                <div className="bg-green-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-slate-700">📅 {fmtDate(nextBooking.preferredDate)}</p>
                  <p className="text-xs text-slate-700">👥 {nextBooking.nbPeople} personnes</p>
                  <p className="text-xs font-semibold text-green-700">≈ {fmtCurrency(computeRevenue(nextBooking))}</p>
                </div>
              </div>
            )}
            {!nextBooking && accepted.length === 0 && (
              <div className="card-elevated p-5 text-center">
                <p className="text-xs text-slate-400">Aucune visite confirmée à venir.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Calendrier ── */}
      {tab === 'calendrier' && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-auto lg:min-w-[420px]">
            <MiniCalendar
              bookings={bookings}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
            />
          </div>
          <div className="flex-1">
            {selectedDay ? (
              <>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                  {fmtDate(selectedDay)}
                </h3>
                {dayEvents.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune visite confirmée ce jour.</p>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((b) => (
                      <div key={b.id} className="card-elevated p-4">
                        <p className="font-medium text-slate-800">{b.fullName}</p>
                        <p className="text-sm text-slate-500">{b.organization}</p>
                        <div className="flex gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                          <span>👥 {b.nbPeople} pers.</span>
                          <span>🌿 {VISIT_TYPE_LABELS[b.visitType as VisitType]}</span>
                          <span className="text-green-700 font-medium">{fmtCurrency(computeRevenue(b))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-sm">
                <p>Cliquez sur une date avec un point vert pour voir les visites.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Résumé ── */}
      {tab === 'resume' && (
        <div className="space-y-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="btn btn-secondary btn-sm" onClick={prevResumeMonth}>←</button>
              <h2 className="text-base font-semibold text-slate-800 capitalize min-w-[160px] text-center">{resumeMonthLabel}</h2>
              <button className="btn btn-secondary btn-sm" onClick={nextResumeMonth} disabled={isCurrentMonth}>→</button>
            </div>
            {!isCurrentMonth && (
              <button
                className="text-xs text-primary font-medium hover:underline"
                onClick={() => { setViewMonth(new Date().getMonth()); setViewYear(new Date().getFullYear()); }}
              >
                ↩ Mois actuel
              </button>
            )}
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visites confirmées</p>
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-4xl font-bold text-slate-900">{thisMonthAccepted.length}</p>
              <p className="text-xs text-slate-400 mt-2">ce mois-ci</p>
            </div>
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visiteurs attendus</p>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-4xl font-bold text-slate-900">{totalPeopleMonth}</p>
              <p className="text-xs text-slate-400 mt-2">personnes</p>
            </div>
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenus estimés</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-4xl font-bold text-green-700">{fmtCurrency(totalRevenueMonth)}</p>
              <p className="text-xs text-slate-400 mt-2">ce mois-ci</p>
            </div>
          </div>

          {/* This week / month bookings */}
          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
              {isCurrentMonth ? 'Cette semaine' : `Visites de ${resumeMonthLabel}`}
            </h3>
            {(isCurrentMonth ? thisWeekAccepted : thisMonthAccepted).length === 0 ? (
              <p className="text-sm text-slate-400">{isCurrentMonth ? 'Aucune visite confirmée cette semaine.' : 'Aucune visite confirmée ce mois.'}</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Organisation</th>
                    <th>Type de visite</th>
                    <th>Personnes</th>
                    <th>Revenu estimé</th>
                  </tr>
                </thead>
                <tbody>
                  {(isCurrentMonth ? thisWeekAccepted : thisMonthAccepted).map((b) => (
                    <tr key={b.id}>
                      <td className="text-sm font-medium text-slate-800">{fmtDate(b.preferredDate)}</td>
                      <td className="text-sm text-slate-600">{b.organization}</td>
                      <td>
                        <span className="text-xs text-slate-500">
                          {VISIT_TYPE_LABELS[b.visitType as VisitType]}
                        </span>
                      </td>
                      <td className="text-sm text-slate-600">{b.nbPeople}</td>
                      <td className="text-sm font-semibold text-green-700">{fmtCurrency(computeRevenue(b))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* By visit type — CSS bar chart */}
          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
              Par type de visite
            </h3>
            <div className="space-y-3">
              {visitTypeCounts.map(({ type, label, count }) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-44 flex-shrink-0">{label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((count / maxVisitCount) * 100)}%`,
                        background: 'linear-gradient(90deg, #2D6A2E, #3db13d)',
                        minWidth: count > 0 ? '20px' : '0',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By group type */}
          <div className="card-elevated p-5">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
              Par type de groupe
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {groupTypeCounts.map(({ type, label, count }) => (
                <div key={type} className="text-center p-4 rounded-xl bg-slate-50">
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
