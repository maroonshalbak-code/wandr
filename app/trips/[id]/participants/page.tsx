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

function buildInviteMessage(personName: string, organizerName: string, tripName: string, appUrl: string) {
  return `Hi ${personName},\n\n${organizerName} has invited you to join the trip "${tripName}" on i-Travel.\n\nInstall the app here:\n${appUrl}\n\nSee you on the trip! ✈️`;
}

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

  // Invite mode
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);

  // Per-participant invite state: undefined | 'email_sent' | 'whatsapp_sent'
  const [inviteState, setInviteState] = useState<Record<string, string>>({});
  // Which participant's invite popover is open
  const [openInviteMenu, setOpenInviteMenu] = useState<string | null>(null);

  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const existingEmails = new Set(trip.participants.map((p) => p.email?.toLowerCase()));
  const organizer = trip.participants[0]?.name ?? 'Someone';

  const searchProfiles = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const supabase = createClient();
      const term = `%${q}%`;
      const [nameRes, emailRes] = await Promise.all([
        supabase.from('profiles').select('id, name, email').ilike('name', term).limit(10),
        supabase.from('profiles').select('id, name, email').ilike('email', term).limit(10),
      ]);
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
    }, profile.id); // pass user_id so RLS lets them see the trip immediately
    setQuery(''); setResults([]); setShowForm(false);
  };

  // Add participant then invite via chosen channel
  const handleInviteVia = async (channel: 'email' | 'whatsapp') => {
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
    const appUrl = window.location.origin;
    const msg = buildInviteMessage(inviteName.trim(), organizer, trip.name, appUrl);
    if (channel === 'email') {
      const subject = encodeURIComponent(`You've been invited to join ${trip.name} on i-Travel`);
      window.open(`mailto:${inviteEmail.trim()}?subject=${subject}&body=${encodeURIComponent(msg)}`, '_blank');
    } else {
      const phone = invitePhone.trim().replace(/\D/g, '');
      const waUrl = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
    }
    setInviteName(''); setInviteEmail(''); setInvitePhone('');
    setInviting(false); setShowForm(false);
  };

  // Invite an existing participant via chosen channel
  const sendInviteTo = (p: { id: string; name: string; email: string }, channel: 'email' | 'whatsapp') => {
    const appUrl = window.location.origin;
    const msg = buildInviteMessage(p.name, organizer, trip.name, appUrl);
    if (channel === 'email') {
      const subject = encodeURIComponent(`You've been invited to join ${trip.name} on i-Travel`);
      window.open(`mailto:${p.email}?subject=${subject}&body=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
    setInviteState((prev) => ({ ...prev, [p.id]: channel === 'email' ? 'email_sent' : 'whatsapp_sent' }));
    setOpenInviteMenu(null);
  };

  const closeForm = () => {
    setShowForm(false); setMode('search');
    setQuery(''); setResults([]);
    setInviteName(''); setInviteEmail(''); setInvitePhone('');
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

      <div className="flex-1 overflow-y-auto px-4 pb-6" onClick={() => setOpenInviteMenu(null)}>

        {/* Add participant panel */}
        {showForm && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            {/* Mode tabs */}
            <div className="flex bg-white rounded-xl p-1 mb-4 gap-1">
              <button onClick={() => setMode('search')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${mode === 'search' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                🔍 {t('searchUsers')}
              </button>
              <button onClick={() => setMode('invite')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${mode === 'invite' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                ✉️ {t('inviteNew')}
              </button>
            </div>

            {/* Search mode */}
            {mode === 'search' && (
              <div className="flex flex-col gap-3">
                <input
                  type="text" value={query} onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={t('searchPlaceholder')} autoFocus
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                {searching && (
                  <div className="flex items-center justify-center py-3">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
                  </div>
                )}
                {!searching && query.length >= 2 && results.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    {t('noUsersFound')}.{' '}
                    <button onClick={() => setMode('invite')} className="text-blue-500 underline">{t('inviteInstead')}</button>
                  </p>
                )}
                {results.length > 0 && (
                  <div className="bg-white rounded-xl border border-blue-100 divide-y divide-gray-50 overflow-hidden">
                    {results.map((profile) => (
                      <button key={profile.id} onClick={() => addExistingUser(profile)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left">
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
                  <p className="text-xs text-gray-400 text-center">{t('typeToSearch')}</p>
                )}
                <button onClick={closeForm} className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                  {t('cancel')}
                </button>
              </div>
            )}

            {/* Invite new user mode */}
            {mode === 'invite' && (
              <div className="flex flex-col gap-3">
                <input
                  type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                  placeholder={t('fullName')} required autoFocus
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <input
                  type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com" required
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <input
                  type="tel" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder={t('phoneOptional')}
                  className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <p className="text-[11px] text-gray-400">{t('inviteHint')}</p>

                {/* Invite channel buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}
                    onClick={() => handleInviteVia('email')}
                    className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    📧 {t('viaEmail')}
                  </button>
                  <button
                    type="button"
                    disabled={inviting || !inviteName.trim() || !inviteEmail.trim()}
                    onClick={() => handleInviteVia('whatsapp')}
                    className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    💬 {t('viaWhatsApp')}
                  </button>
                </div>
                <button type="button" onClick={closeForm}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                  {t('cancel')}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {trip.participants.length} {t('people').toLowerCase()}
        </p>

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
                  {p.role === 'organizer' ? t('organizer') : t('member')}
                </span>

                {/* Invite button with popover */}
                {p.role !== 'organizer' && p.email && (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenInviteMenu(openInviteMenu === p.id ? null : p.id)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                        inviteState[p.id] ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
                      }`}
                    >
                      {inviteState[p.id] === 'email_sent' ? '📧 ' + t('invited')
                        : inviteState[p.id] === 'whatsapp_sent' ? '💬 ' + t('invited')
                        : t('inviteAction')}
                    </button>

                    {/* Popover */}
                    {openInviteMenu === p.id && (
                      <div className="absolute bottom-full mb-1 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10 w-36">
                        <button
                          onClick={() => sendInviteTo({ id: p.id, name: p.name, email: p.email! }, 'email')}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-blue-50 transition-colors"
                        >
                          📧 <span>{t('viaEmail')}</span>
                        </button>
                        <div className="h-px bg-gray-100" />
                        <button
                          onClick={() => sendInviteTo({ id: p.id, name: p.name, email: p.email! }, 'whatsapp')}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 hover:bg-green-50 transition-colors"
                        >
                          💬 <span>{t('viaWhatsApp')}</span>
                        </button>
                      </div>
                    )}
                  </div>
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
