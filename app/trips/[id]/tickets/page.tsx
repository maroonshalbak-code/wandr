'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import Badge from '@/components/Badge';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { Ticket } from '@/lib/types';

const typeEmojis: Record<Ticket['type'], string> = {
  flight: '✈️',
  train: '🚄',
  bus: '🚌',
  hotel: '🏨',
  other: '🎫',
};

export default function TicketsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading, addTicket, removeTicket } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks before any early returns (Rules of Hooks)
  // Use optional chaining for initializers that depend on trip
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<Ticket['type']>('flight');
  const [title, setTitle] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(trip?.startDate ?? '');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(trip?.participants.length || 1);
  const [status, setStatus] = useState<Ticket['status']>('pending');
  const [reference, setReference] = useState('');

  // Early returns after all hooks
  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return;
    addTicket(id, { type, title: title || `${from} → ${to}`, from, to, date, time: time || undefined, passengers, status, reference: reference || undefined });
    setTitle(''); setFrom(''); setTo(''); setTime(''); setReference('');
    setShowForm(false);
  };

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href={`/trips/${id}`} />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('tickets')}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Add ticket"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {showForm && (
          <form onSubmit={handleAdd} className="bg-blue-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-blue-900">{t('addTicket')}</p>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Type</label>
              <div className="flex gap-2 flex-wrap">
                {(['flight','train','bus','hotel','other'] as Ticket['type'][]).map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${type === t ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}>
                    {typeEmojis[t]} {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="DXB"
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="NRT"
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Passengers</label>
                <input type="number" min={1} value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Reference</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="NH205"
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Status</label>
              <div className="flex gap-2">
                {(['confirmed','pending','cancelled'] as Ticket['status'][]).map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${status === s ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600">{t('add')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">{t('cancel')}</button>
            </div>
          </form>
        )}

        {trip.tickets.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-5xl">🎫</span>
            <p className="text-gray-400 text-sm text-center">No tickets yet.<br/>Tap + to add flights, trains, or hotels.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {trip.tickets.map((tk) => (
            <div key={tk.id} className="bg-white rounded-2xl border border-gray-100 p-4 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{typeEmojis[tk.type]}</span>
                  <p className="text-sm font-semibold text-gray-900">{tk.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={tk.status} />
                  <button
                    onClick={() => removeTicket(id, tk.id)}
                    className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Delete ticket"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold text-gray-900">{tk.from}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                </svg>
                <span className="text-lg font-bold text-gray-900">{tk.to}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 flex gap-4 flex-wrap">
                <span className="text-xs text-gray-500">
                  📅 {new Date(tk.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  {tk.time ? ` · ${tk.time}` : ''}
                </span>
                {tk.duration && <span className="text-xs text-gray-500">⏱ {tk.duration}</span>}
                <span className="text-xs text-gray-500">👤 {tk.passengers} pax</span>
                {tk.reference && <span className="text-xs text-gray-500">🔖 {tk.reference}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
