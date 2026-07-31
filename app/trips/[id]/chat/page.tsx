'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { fetchMessages, insertMessage } from '@/lib/db/trips';
import { notifyTrip } from '@/lib/notify';
import type { Message } from '@/lib/types';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, loading } = useTrips();
  const { t } = useLang();
  const trip = getTrip(id);

  // All hooks before any early returns (Rules of Hooks)
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user?.id ?? null));
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchMessages(id);
      setMessages(data);
    } catch {
      // silently ignore poll errors
    }
  }, [id]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Early returns after all hooks
  if (loading) return (
    <MobileShell>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    </MobileShell>
  );
  if (!trip) notFound();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSendError('');
    setSending(true);
    setText('');
    try {
      const msg = await insertMessage(id, trimmed);
      setMessages((prev) => [...prev, msg]);
      if (currentUserId && trip) {
        const sender = trip.participants.find(p => p.id === currentUserId)?.name ?? 'Someone';
        notifyTrip(id, 'new_message', `${sender}: ${trimmed.slice(0, 60)}`, trip.name, currentUserId);
      }
    } catch (err) {
      setSendError((err as Error).message);
      setText(trimmed); // restore so the user doesn't lose their message
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0 border-b border-gray-100">
        <BackButton href={`/trips/${id}`} />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-900 leading-tight truncate">{trip.name}</h1>
          <p className="text-xs text-gray-400">{trip.participants.length} participant{trip.participants.length !== 1 ? 's' : ''}</p>
        </div>
        <span className="text-xl">💬</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <span className="text-5xl">💬</span>
            <p className="text-gray-400 text-sm text-center">{t('noMessages')}<br />{t('startConversation')}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.userId === currentUserId;
          const prevMsg = messages[i - 1];
          const showSender = !isOwn && msg.userId !== prevMsg?.userId;

          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {showSender && (
                <p className="text-[11px] font-medium text-gray-400 mb-1 ml-1">{msg.senderName}</p>
              )}
              <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                isOwn
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
              }`}>
                {msg.content}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 mx-1">
                {new Date(msg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {sendError && (
        <div className="mx-4 mb-1 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
          {sendError.includes('relation "messages" does not exist') || sendError.includes('does not exist')
            ? '⚠️ Run the SQL migration in Supabase (002_chat_location.sql) to enable chat.'
            : `⚠️ ${sendError}`}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 pb-5 pt-2 flex-shrink-0 border-t border-gray-100 bg-white"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('messagePlaceholder')}
          className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 disabled:opacity-50 transition-colors flex-shrink-0"
          aria-label="Send"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/>
          </svg>
        </button>
      </form>
    </MobileShell>
  );
}
