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

interface Profile { id: string; name: string; email: string }

export default function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading, addParticipant, removeParticipant } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks before early returns
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<'search' | 'invite'>('search');

  // Search mode
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDebug, setSearchDebug] = useState('');

  // Invite mode
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const [inviteState, setInviteState] = useState<Record<string, 'sent'>>({});

  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const existingEmails = new Set(trip.participants.map((p) => p.email?.toLowerCase()));

  const searchProfiles = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const supabase = createClient();
      const term = `%${q}%`;

      // Two separate ilike queries, then merge & dedupe
      const [nameRes, emailRes] = await Promise.all([
        supabase.from('profiles').select('id, name, email').ilike('name', term).limit(10),
        supabase.from('profiles').select('id, name, email').ilike('email', term).limit(10),
      ]);

      const nameErr = nameRes.error?.message ?? 'ok';
      const emailErr = emailRes.error?.message ?? 'ok';
      const rawCount = (nameRes.data?.length ?? 0) + (emailRes.data?.length ?? 0);
      setSearchDebug(`name:${nameErr} email:${emailErr} raw:${rawCount} existing:[${[...existingEmails].join(',')}]`);

      const seen = new Set<string>();
      const merged: Profile[] = [];
      for (const p of [...(nameRes.data ?? []), ...(emailRes.data ?? [])]) {
        if (!seen.has(p.id) && !existingEmails.has((p.email as string)?.toLowerCase())) {
          seen.add(p.id);
          merged.push({ id: p.id as string, name: p.name as string, email: p.email as string });
        }
      }
      setResults(merged);
    } finally {
      setSearching(false);
    }
  };

  const handleQueryChange = (q: string) => {
    setQuery(q);
    searchProfiles(q);
  };

  const addExistingUser = async (profile: Profile) => {
    const color = COLORS[trip.participants.length % COLORS.length];
    await addParticipant(id, {
      name: profile.name,
      email: profile.email,
      initials: getInitials(profile.name),
      color,
      role: 'member',
    });
    setQuery(''); setResults([]); setShowForm(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setInviting(true);
    const color = COLORS[trip.participants.length % COLORS.length];
    await addParticipant(id, {
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      initials: getInitials(inviteName),
      color,
      role: 'member',
    });
    // Open email invite
    const appUrl = window.location.origin;
    const organizer = trip.participants[0]?.name ?? 'Someone';
    const subject = encodeURIComponent(`You've been invited to join ${trip.name} on i-Travel`);
    const body = encodeURIComponent(
      `Hi ${inviteName.trim()},\n\n${organizer} has invited you to join the trip "${trip.name}" on i-Travel.\n\nInstall the app here:\n${appUrl}\n\nSee you on the trip! ✈️`
    );
    window.open(`mailto:${inviteEmail.trim()}?subject=${subject}&body=${body}`, '_blank');
    setInviteName(''); setInviteEmail(''); setInviting(false); setShowForm(false);
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

  const closeForm = () => {
    setShowForm(false); setMode('search');
    setQuery(''); setResults([]);
    setInviteName(''); setInviteEmail('');
  };

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href={`/trips/${id}`} />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('participants')}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Add participant"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* Add participant panel */}
        {showForm && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            {/* Mode tabs */}
            <div className="flex bg-white rounded-xl p-1 mb-4 gap-1">
              <button
                onClick={() => setMode('search')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${mode === 'search' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                🔍 Search users
              </button>
              <button
                onClick={() => setMode('invite')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${mode === 'invite' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                ✉️ Invite new
              </button>
            </div>

            {/* Search mode */}
            {mode === 'search' && (
              <div className="flex flex-col gap-3">
                <input
                  type="text" value={query} onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search by name or email…"
                  autoFocus
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                {searching && (
                  <div className="flex items-center justify-center py-3">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
                  </div>
                )}
                {!searching && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-400">
                      No users found.{' '}
                      <button onClick={() => setMode('invite')} className="text-blue-500 underline">Invite them instead</button>
                    </p>
                    {searchDebug && (
                      <p className="text-[10px] text-orange-400 mt-1 break-all px-1">{searchDebug}</p>
                    )}
                  </div>
                )}
                {results.length > 0 && (
                  <div className="bg-white rounded-xl border border-blue-100 divide-y divide-gray-50 overflow-hidden">
                    {results.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => addExistingUser(profile)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                          {getInitials(profile.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                          <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                        </div>
                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
                {query.length < 2 && (
                  <p className="text-xs text-gray-400 text-center">Type at least 2 characters to search</p>
                )}
                <button onClick={closeForm} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                  {t('cancel')}
                </button>
              </div>
            )}

            {/* Invite new user mode */}
            {mode === 'invite' && (
              <form onSubmit={handleInvite} className="flex flex-col gap-3">
                <input
                  type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Full name" required autoFocus
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <input
                  type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com" required
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <p className="text-[11px] text-gray-400">We'll add them to the trip and open an email invite for you to send.</p>
                <div className="flex gap-2">
                  <button type="submit" disabled={inviting}
                    className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-60">
                    {inviting ? '…' : 'Add & Invite'}
                  </button>
                  <button type="button" onClick={closeForm}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                    {t('cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
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
