'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { Plan } from '@/lib/types';

const typeColors: Record<Plan['type'], string> = {
  transport: 'bg-blue-400',
  activity: 'bg-green-400',
  accommodation: 'bg-purple-400',
  food: 'bg-orange-400',
};

const typeEmojis: Record<Plan['type'], string> = {
  transport: '🚗',
  activity: '🎯',
  accommodation: '🏨',
  food: '🍽️',
};

function groupByDate(plans: Plan[]) {
  const map = new Map<string, Plan[]>();
  for (const p of plans) {
    const arr = map.get(p.date) ?? [];
    arr.push(p);
    map.set(p.date, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function PlansPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading, addPlan, removePlan } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks before any early returns (Rules of Hooks)
  // Use optional chaining for initializers that depend on trip
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(trip?.startDate ?? '');
  const [time, setTime] = useState('');
  const [type, setType] = useState<Plan['type']>('activity');
  const [location, setLocation] = useState('');

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
    if (!title.trim()) return;
    addPlan(id, { title: title.trim(), description: description.trim(), date, time: time || undefined, type, location: location.trim() || undefined });
    setTitle('');
    setDescription('');
    setTime('');
    setLocation('');
    setShowForm(false);
  };

  const grouped = groupByDate(trip.plans);

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href={`/trips/${id}`} />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('plans')}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Add plan"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {showForm && (
          <form onSubmit={handleAdd} className="bg-blue-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-blue-900">{t('addPlan')}</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              required
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details (optional)"
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (optional)"
                className="w-full rounded-xl border border-blue-200 pl-8 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date</label>
                <input type="date" value={date} min={trip.startDate} max={trip.endDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Type</label>
              <div className="flex gap-2 flex-wrap">
                {(['activity', 'transport', 'food', 'accommodation'] as Plan['type'][]).map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${type === t ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}>
                    {typeEmojis[t]} {t}
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

        {grouped.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-5xl">🗓️</span>
            <p className="text-gray-400 text-sm text-center">No plans yet.<br/>Tap + to add your first activity.</p>
          </div>
        )}

        {grouped.map(([date, plans]) => (
          <div key={date} className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="flex flex-col gap-2">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 items-start group">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${typeColors[plan.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{plan.title}</p>
                    {plan.description && <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>}
                    {plan.location && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-500 truncate max-w-[120px]">📍 {plan.location}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          Maps
                        </a>
                        <a
                          href={`https://waze.com/ul?q=${encodeURIComponent(plan.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors"
                        >
                          Waze
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {plan.time && <span className="text-xs text-gray-400">{plan.time}</span>}
                    <button
                      onClick={() => removePlan(id, plan.id)}
                      className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Delete plan"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
