'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import Badge from '@/components/Badge';
import InstallBanner from '@/components/InstallBanner';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const { trips, loading, error } = useTrips();
  const { t } = useLang();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      const name = (user?.user_metadata?.name as string)
        ?? user?.email?.split('@')[0]
        ?? '';
      setUserName(name);
    });
  }, []);

  const upcoming = trips.filter((t) => t.status === 'upcoming' || t.status === 'planning' || t.status === 'active');
  const past = trips.filter((t) => t.status === 'completed');
  const nextTrip = upcoming[0];
  const now = new Date().getTime();

  const daysUntil = nextTrip
    ? Math.ceil((new Date(nextTrip.startDate).getTime() - now) / 86400000)
    : null;

  return (
    <>
    <InstallBanner />
    <MobileShell>
      <div className="flex items-center justify-between px-5 pt-2 pb-2 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">{t('trips')}</h1>
        <Link
          href="/trips/new"
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={t('newTrip')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="bg-blue-50 rounded-2xl p-4 mb-4">
              <p className="text-sm text-blue-500 font-medium">Hey, {userName} 👋</p>
              <p className="text-lg font-semibold text-blue-900 mt-0.5">
                {upcoming.length} {t('trips').toLowerCase()} {t('plans').toLowerCase()}
              </p>
              {daysUntil !== null && daysUntil >= 0 && (
                <p className="text-xs text-blue-400 mt-1">
                  {t('newTrip')} · {daysUntil}d
                </p>
              )}
            </div>

            {upcoming.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {t('plans')}
                </p>
                {upcoming.map((trip) => <TripCard key={trip.id} trip={trip} />)}
              </>
            )}

            {past.length > 0 && (
              <>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                  Past
                </p>
                {past.map((trip) => <TripCard key={trip.id} trip={trip} />)}
              </>
            )}

            {trips.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-5xl">🌍</span>
                <p className="text-gray-500 text-sm text-center">
                  {t('noTrips')}.<br/>{t('addFirstTrip')}.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </MobileShell>
    </>
  );
}

function TripCard({ trip }: { trip: ReturnType<typeof useTrips>['trips'][0] }) {
  const { t } = useLang();
  return (
    <Link href={`/trips/${trip.id}`} className="block">
      <div className="flex gap-3 items-start bg-white border border-gray-100 rounded-2xl p-3.5 mb-2.5 hover:border-gray-200 transition-colors">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: trip.bg }}>
          {trip.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{trip.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {trip.participants.length} {t('participants').toLowerCase()} · {trip.photos.length} {t('photos').toLowerCase()}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-gray-400">
              {new Date(trip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
              {new Date(trip.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <Badge status={trip.status} />
          </div>
        </div>
      </div>
    </Link>
  );
}
