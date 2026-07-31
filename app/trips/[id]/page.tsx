'use client';

import { use, useState } from 'react';
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
  const { getTrip, loading, removeTrip } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks before early returns
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const nights = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeTrip(id);
      window.location.href = '/';
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const sections = [
    { href: `/trips/${id}/chat`,         label: t('chat'),         count: null,                     icon: '💬' },
    { href: `/trips/${id}/tasks`,        label: t('tasks'),        count: trip.tasks.length,        icon: '✅' },
    { href: `/trips/${id}/plans`,        label: t('plans'),        count: trip.plans.length,        icon: '🗓️' },
    { href: `/trips/${id}/photos`,       label: t('photos'),       count: trip.photos.length,       icon: '📷' },
    { href: `/trips/${id}/participants`, label: t('people'),       count: trip.participants.length, icon: '👥' },
    { href: `/trips/${id}/payments`,     label: t('payments'),     count: trip.payments.length,     icon: '💳' },
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
        <div className="absolute top-3 right-4 flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-8 h-8 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/40 hover:text-white transition-colors"
            aria-label="Delete trip"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
            </svg>
          </button>
          <Badge status={trip.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Quick-nav grid */}
        <div className="grid grid-cols-3 gap-1.5 mt-4 mb-4">
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

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('deleteTrip')} &ldquo;{trip.name}&rdquo;?</p>
                <p className="text-xs text-gray-400 mt-0.5">{t('deleteTripWarning')}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? '…' : t('deleteTrip')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
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
