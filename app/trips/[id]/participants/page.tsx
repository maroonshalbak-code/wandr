'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { Avatar } from '@/components/Avatar';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, addParticipant, removeParticipant } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);
  if (!trip) notFound();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const color = COLORS[trip.participants.length % COLORS.length];
    addParticipant(id, { name: name.trim(), email: email.trim(), initials: getInitials(name), color, role: 'member' });
    setName('');
    setEmail('');
    setShowForm(false);
  };

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href={`/trips/${id}`} />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('participants')}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Invite person"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {showForm && (
          <form onSubmit={handleAdd} className="bg-blue-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-blue-900">{t('inviteSomeone')}</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600">{t('add')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">{t('cancel')}</button>
            </div>
          </form>
        )}

        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{trip.participants.length} people</p>

        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {trip.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3.5">
              <Avatar participant={p} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{p.name} {p.email === 'maroon.shalbak@consensys.net' ? '(you)' : ''}</p>
                <p className="text-xs text-gray-400 truncate">{p.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${p.role === 'organizer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.role}
                </span>
                {p.role !== 'organizer' && (
                  <button
                    onClick={() => removeParticipant(id, p.id)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                    aria-label="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {trip.participants.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">
              No participants yet. Tap + to invite someone.
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
