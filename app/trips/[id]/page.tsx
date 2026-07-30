'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import Badge from '@/components/Badge';
import { AvatarStack } from '@/components/Avatar';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';

const planTypeColors: Record<string, string> = {
  transport: 'bg-blue-400',
  activity: 'bg-green-400',
  accommodation: 'bg-purple-400',
  food: 'bg-orange-400',
};

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);
  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const nights = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000);

  const sections = [
    { href: `/trips/${id}/chat`,         label: t('chat'),         count: null,                    icon: '💬' },
    { href: `/trips/${id}/tasks`,        label: t('tasks'),        count: trip.tasks.length,       icon: '✅' },
    { href: `/trips/${id}/plans`,        label: t('plans'),        count: trip.plans.length,       icon: '🗓️' },
    { href: `/trips/${id}/photos`,       label: t('photos'),       count: trip.photos.length,      icon: '📷' },
    { href: `/trips/${id}/participants`, label: t('people'),       count: trip.participants.length, icon: '👥' },
  ];

  return (
    <MobileShell>
      {/* Hero */}
      <div className="relative flex-shrink-0" style={{ height: 160, backgroundColor: trip.bg }}>
        <div className="absolute inset-0 flex items-center justify-center text-7xl">{trip.emoji}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-lg leading-tight drop-shadow">{trip.name}</p>
          <p className="text-white/80 text-xs mt-0.5 drop-shadow">
            {new Date(trip.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {new Date(trip.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {nights} night{nights !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="absolute top-3 left-4">
          <BackButton href="/" label="" />
        </div>
        <div className="absolute top-3 right-4">
          <Badge status={trip.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-1.5 mt-4 mb-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="bg-white rounded-xl border border-gray-100 p-2 flex flex-col items-center gap-0.5 hover:border-gray-200 transition-colors">
              <span className="text-lg">{s.icon}</span>
              {s.count !== null
                ? <span className="text-sm font-bold text-gray-900">{s.count}</span>
                : <span className="text-sm font-bold text-blue-500">→</span>
              }
              <span className="text-[9px] text-gray-400 leading-tight text-center">{s.label}</span>
            </Link>
          ))}
        </div>

        {/* Participants */}
        <SectionHeader title={t('participants')} href={`/trips/${id}/participants`} seeAll={t('seeAll')} />
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 mb-4 flex items-center gap-3">
          <AvatarStack participants={trip.participants} />
          <p className="text-xs text-gray-500 flex-1">
            {trip.participants.slice(0, 2).map((p) => p.name).join(', ')}
            {trip.participants.length > 2 ? ` +${trip.participants.length - 2} more` : ''}
            {trip.participants.length === 0 ? t('noParticipants') : ''}
          </p>
          <Link href={`/trips/${id}/participants`} className="text-blue-500 text-xs font-medium">{t('manage')}</Link>
        </div>

        {/* Photos preview */}
        <SectionHeader title={t('photos')} href={`/trips/${id}/photos`} seeAll={t('seeAll')} />
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {trip.photos.slice(0, 5).map((ph) => (
            <div key={ph.id} className="aspect-square rounded-xl overflow-hidden flex items-center justify-center text-3xl" style={{ backgroundColor: ph.bg }}>
              {ph.url
                ? <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover" />
                : ph.emoji
              }
            </div>
          ))}
          <Link
            href={`/trips/${id}/photos`}
            className="aspect-square rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
          </Link>
        </div>

        {/* Plans preview */}
        <SectionHeader title={t('plans')} href={`/trips/${id}/plans`} seeAll={t('seeAll')} />
        <div className="flex flex-col gap-2 mb-4">
          {trip.plans.slice(0, 3).map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-2.5 items-start">
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${planTypeColors[plan.type] ?? 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{plan.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{plan.time ?? ''}</span>
            </div>
          ))}
          {trip.plans.length > 3 && (
            <Link href={`/trips/${id}/plans`} className="text-center text-xs text-blue-500 py-2">
              +{trip.plans.length - 3} more
            </Link>
          )}
          {trip.plans.length === 0 && (
            <Link href={`/trips/${id}/plans`} className="bg-white rounded-xl border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400 hover:bg-gray-50">
              {t('addFirstPlan')}
            </Link>
          )}
        </div>

        {/* Tickets preview */}
        <SectionHeader title={t('tickets')} href={`/trips/${id}/tickets`} seeAll={t('seeAll')} />
        <div className="flex flex-col gap-2">
          {trip.tickets.slice(0, 2).map((tk) => (
            <div key={tk.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
              <span className="text-xl">{tk.type === 'flight' ? '✈️' : tk.type === 'train' ? '🚄' : tk.type === 'hotel' ? '🏨' : '🎫'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{tk.from} → {tk.to}</p>
                <p className="text-xs text-gray-400">{tk.date} {tk.time ? `· ${tk.time}` : ''}</p>
              </div>
              <Badge status={tk.status} />
            </div>
          ))}
          {trip.tickets.length === 0 && (
            <Link href={`/trips/${id}/tickets`} className="bg-white rounded-xl border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400 hover:bg-gray-50">
              {t('addTickets')}
            </Link>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

function SectionHeader({ title, href, seeAll }: { title: string; href: string; seeAll: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <Link href={href} className="text-xs text-blue-500 font-medium">{seeAll}</Link>
    </div>
  );
}
