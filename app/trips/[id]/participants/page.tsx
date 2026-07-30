'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { Avatar } from '@/components/Avatar';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899'];

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

async function isRegisteredUser(email: string): Promise<boolean> {
  if (!email.trim()) return false;
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  return !!data;
}

export default function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading, addParticipant, removeParticipant } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks before any early returns (Rules of Hooks)
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [inviteState, setInviteState] = useState<Record<string, 'sent'>>({});

  // Early returns after all hooks
  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);

    const color = COLORS[trip.participants.length % COLORS.length];
    const participantEmail = email.trim().toLowerCase();

    const registered = participantEmail ? await isRegisteredUser(participantEmail) : false;

    addParticipant(id, {
      name: name.trim(),
      email: participantEmail,
      initials: getInitials(name),
      color,
      role: 'member',
    });

    if (participantEmail && !registered) {
      const appUrl = window.location.origin;
      const organizer = trip.participants[0]?.name ?? 'Someone';
      const subject = encodeURIComponent(`You've been invited to join ${trip.name} on i-Travel`);
      const body = encodeURIComponent(
        `Hi ${name.trim()},\n\n${organizer} has invited you to join the trip "${trip.name}" on i-Travel.\n\nInstall the app here:\n${appUrl}\n\nSee you on the trip! ✈️`
      );
      window.open(`mailto:${participantEmail}?subject=${subject}&body=${body}`, '_blank');
    }

    setName(''); setEmail(''); setAdding(false); setShowForm(false);
  };

  const sendInvite = (p: { id: string; name: string; email: string }) => {
    const appUrl = window.location.origin;
    const organizer = trip.participants[0]?.name ?? 'Someone';
    const subject = encodeURIComponent(`You've been invited to join ${trip.name} on i-Travel`);
    const body = encodeURIComponent(
      `Hi ${p.name},\n\n${organizer} has invited you to join the trip "${trip.name}" on i-Travel.\n\nInstall the app here:\n${appUrl}\n\nSee you on the trip! ✈️`
    );
    window.open(`mailto:${p.email}?subject=${subject}&body=${body}`, '_blank');
    setInviteState((prev) => ({ ...prev, [p.id]: 'sent' }));
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" required />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
            <p className="text-[11px] text-gray-400">If they don't have an account yet, we'll open an email invite for you to send.</p>
            <div className="flex gap-2">
              <button type="submit" disabled={adding} className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-60">
                {adding ? '…' : t('add')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{trip.participants.length} people</p>

        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {trip.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3.5">
              <Avatar participant={p} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400 truncate">{p.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${p.role === 'organizer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.role}
                </span>
                {p.role !== 'organizer' && p.email && (
                  <button onClick={() => sendInvite({ id: p.id, name: p.name, email: p.email! })}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${inviteState[p.id] === 'sent' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-500 hover:bg-orange-100'}`}>
                    {inviteState[p.id] === 'sent' ? '✓ Invited' : '✉ Invite'}
                  </button>
                )}
                {p.role !== 'organizer' && (
                  <button onClick={() => removeParticipant(id, p.id)}
                    className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors" aria-label="Remove">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {trip.participants.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">{t('noParticipants')}</div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
