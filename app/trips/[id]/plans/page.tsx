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

const typeBadgeColors: Record<Plan['type'], string> = {
  transport: 'bg-blue-100 text-blue-700',
  activity: 'bg-green-100 text-green-700',
  accommodation: 'bg-purple-100 text-purple-700',
  food: 'bg-orange-100 text-orange-700',
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

  // All hooks before any early returns
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(trip?.startDate ?? '');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [planType, setPlanType] = useState<Plan['type']>('activity');
  const [location, setLocation] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
    addPlan(id, {
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || undefined,
      endTime: endTime || undefined,
      type: planType,
      location: location.trim() || undefined,
    });
    setTitle(''); setDescription(''); setTime(''); setEndTime(''); setLocation('');
    setShowForm(false);
  };

  const handleDelete = (planId: string) => {
    removePlan(id, planId);
    setSelectedPlan(null);
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
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={t('planTitle')} required autoFocus
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={t('planDetails')}
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
              <input
                type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder={t('locationOptional')}
                className="w-full rounded-xl border border-blue-200 pl-8 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
            </div>
            {/* Date */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('date')}</label>
              <input type="date" value={date} min={trip.startDate} max={trip.endDate}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
            </div>
            {/* Start time + End time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('startTime')}</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('endTime')}</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
              </div>
            </div>
            {/* Type */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('type')}</label>
              <div className="flex gap-2 flex-wrap">
                {(['activity', 'transport', 'food', 'accommodation'] as Plan['type'][]).map((pt) => (
                  <button key={pt} type="button" onClick={() => setPlanType(pt)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${planType === pt ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}>
                    {typeEmojis[pt]} {t(pt)}
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
            <p className="text-gray-400 text-sm text-center">{t('noPlans')}<br/>{t('tapToAdd')}</p>
          </div>
        )}

        {grouped.map(([d, plans]) => (
          <div key={d} className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="flex flex-col gap-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 items-start text-left w-full hover:border-gray-200 hover:shadow-sm transition-all active:scale-[0.99]"
                >
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${typeColors[plan.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{plan.title}</p>
                    {plan.description && <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>}
                    {plan.location && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {plan.location}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {plan.time && (
                      <span className="text-xs text-gray-500 font-medium">
                        {plan.time}{plan.endTime ? ` – ${plan.endTime}` : ''}
                      </span>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeBadgeColors[plan.type]}`}>
                      {typeEmojis[plan.type]} {t(plan.type)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Plan detail bottom sheet */}
      {selectedPlan && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setSelectedPlan(null)}>
          <div className="w-full bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Type badge + title */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${typeBadgeColors[selectedPlan.type]}`}>
                {typeEmojis[selectedPlan.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900">{selectedPlan.title}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${typeBadgeColors[selectedPlan.type]}`}>
                  {t(selectedPlan.type)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3">
              {/* Date & time */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-lg">📅</span>
                <div>
                  <p className="text-xs text-gray-400">{t('date')}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(selectedPlan.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>

              {(selectedPlan.time || selectedPlan.endTime) && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-lg">⏰</span>
                  <div>
                    <p className="text-xs text-gray-400">{t('startTime')}{selectedPlan.endTime ? ` – ${t('endTime')}` : ''}</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedPlan.time ?? '–'}{selectedPlan.endTime ? ` → ${selectedPlan.endTime}` : ''}
                    </p>
                  </div>
                </div>
              )}

              {selectedPlan.description && (
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-lg">📝</span>
                  <div>
                    <p className="text-xs text-gray-400">{t('planDetails')}</p>
                    <p className="text-sm text-gray-800 mt-0.5">{selectedPlan.description}</p>
                  </div>
                </div>
              )}

              {selectedPlan.location && (
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-lg">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">{t('locationOptional').replace(' (optional)', '').replace(' (اختياري)', '').replace(' (אופציונלי)', '')}</p>
                    <p className="text-sm text-gray-800 mt-0.5 break-words">{selectedPlan.location}</p>
                    <div className="flex gap-2 mt-2">
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlan.location)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200">
                        Google Maps
                      </a>
                      <a href={`https://waze.com/ul?q=${encodeURIComponent(selectedPlan.location)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-100 text-cyan-700 hover:bg-cyan-200">
                        Waze
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => handleDelete(selectedPlan.id)}
                className="flex-1 py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50"
              >
                {t('delete')}
              </button>
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
