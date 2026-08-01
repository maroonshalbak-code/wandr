'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { TripStatus } from '@/lib/types';

const EMOJIS = ['🌍','🇯🇵','🇵🇹','🇮🇹','🇫🇷','🇺🇸','🇬🇧','🇦🇺','🇹🇭','🇧🇷','🇲🇽','🇪🇸','🏝️','🏔️','🏕️'];
const BG_COLORS = ['#dbeafe','#dcfce7','#fef3c7','#fce7f3','#ede9fe','#fee2e2','#e0f2fe','#f0fdf4'];

export default function NewTripPage() {
  const router = useRouter();
  const { addTrip } = useTrips();
  const { t } = useLang();
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [emoji, setEmoji] = useState('🌍');
  const [bg, setBg] = useState(BG_COLORS[0]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate || submitting) return;
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    let status: TripStatus = 'planning';
    if (startDate <= today && endDate >= today) status = 'active';
    else if (startDate > today) status = 'upcoming';
    try {
      const trip = await addTrip({ name, destination, emoji, bg, startDate, endDate, status });
      router.push(`/trips/${trip.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href="/" />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('newTrip')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Emoji & color picker */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('iconLabel')}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${emoji === e ? 'ring-2 ring-blue-400 bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('colorLabel')}</p>
            <div className="flex gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBg(c)}
                  className={`w-8 h-8 rounded-full transition-all ${bg === c ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t('tripName')} *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('tripNamePlaceholder')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">{t('destination')}</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t('destinationPlaceholder')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('startDate')} *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('endDate')} *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3.5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl" style={{ backgroundColor: bg }}>
                {emoji}
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{name}</p>
                <p className="text-xs text-gray-400">{destination || t('destinationTbd')}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-colors disabled:opacity-60 mt-2"
          >
            {submitting ? t('creating') : t('createTrip')}
          </button>
        </form>
      </div>
    </MobileShell>
  );
}
