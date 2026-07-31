'use client';

import { useEffect, useState } from 'react';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/context/LanguageContext';
import { LOCALE_NAMES, LOCALE_FLAGS, SupportedLocale } from '@/lib/i18n';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushSubscribe';
import type { User } from '@supabase/supabase-js';

type NotifPrefs = {
  new_trip: boolean;
  new_task: boolean;
  new_payment: boolean;
  new_message: boolean;
  new_plan: boolean;
};

const DEFAULT_PREFS: NotifPrefs = {
  new_trip: true, new_task: true, new_payment: true,
  new_message: true, new_plan: true,
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [langSaved, setLangSaved] = useState(false);
  const { t, locale, setLocale } = useLang();

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('loading');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);

  const handleLocaleChange = (l: SupportedLocale) => {
    setLocale(l);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      // Push permission status (evaluated after mount so window is available)
      setPushSupported(isPushSupported());
      setPushPermission(getNotificationPermission());
      // Load saved preferences
      if (u) {
        const { data: p } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', u.id)
          .maybeSingle();
        if (p) setPrefs(p as NotifPrefs);
      }
    });
  }, []);

  const handleTogglePush = async () => {
    if (!isPushSupported()) return;
    setPushLoading(true);
    setPushError(null);
    if (pushPermission === 'granted') {
      await unsubscribeFromPush();
      setPushPermission('default');
    } else {
      const result = await subscribeToPush();
      if (result === 'granted') {
        setPushPermission('granted');
      } else if (result === 'denied') {
        setPushPermission('denied');
      } else {
        // 'error' — subscription failed after permission was granted
        setPushPermission(Notification.permission);
        setPushError('Subscription failed. Check console for details.');
      }
    }
    setPushLoading(false);
  };

  const handlePrefToggle = async (key: keyof NotifPrefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    const supabase = createClient();
    if (user) {
      await supabase.from('notification_preferences').upsert({
        user_id: user.id,
        ...updated,
      });
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const name = (user?.user_metadata?.name as string) ?? user?.email ?? 'You';
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <MobileShell>
      <div className="flex items-center px-5 pt-2 pb-3 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">{t('profile')}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pb-20 pt-6 gap-4 overflow-y-auto">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-500">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">{name}</p>
          {user?.email && <p className="text-sm text-gray-400">{user.email}</p>}
        </div>

        {/* Account info */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-gray-700">{t('account')}</span>
            <span className="text-xs text-gray-400 truncate max-w-[160px]">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-gray-700">{t('memberSince')}</span>
            <span className="text-xs text-gray-400">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
        </div>

        {/* Language picker */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">{t('language')}</p>
            {langSaved && (
              <span className="text-xs text-green-600 font-medium animate-pulse">✓ {t('language')} saved</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LOCALE_NAMES) as SupportedLocale[]).map((l) => (
              <button
                key={l}
                onClick={() => handleLocaleChange(l)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  locale === l
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{LOCALE_FLAGS[l]}</span>
                <span>{LOCALE_NAMES[l]}</span>
                {locale === l && (
                  <svg className="w-4 h-4 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Push notifications */}
        {pushSupported && (
          <div className="w-full bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">{t('notifications')}</p>
              <button
                onClick={handleTogglePush}
                disabled={pushLoading || pushPermission === 'denied'}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${
                  pushPermission === 'granted' ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  pushPermission === 'granted' ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {pushPermission === 'denied' && (
              <p className="text-[11px] text-red-400 mb-2">{t('notificationsBlocked')}</p>
            )}
            {pushError && (
              <p className="text-[11px] text-red-400 mb-2">{pushError}</p>
            )}

            {pushPermission === 'granted' && (
              <div className="flex flex-col gap-0 divide-y divide-gray-50">
                {([
                  ['new_trip',    '🧳', t('notifyNewTrip')],
                  ['new_task',    '✅', t('notifyNewTask')],
                  ['new_payment', '💳', t('notifyNewPayment')],
                  ['new_message', '💬', t('notifyNewMessage')],
                  ['new_plan',    '🗓️', t('notifyNewPlan')],
                ] as [keyof NotifPrefs, string, string][]).map(([key, icon, label]) => (
                  <div key={key} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-gray-700">{icon} {label}</span>
                    <button
                      onClick={() => handlePrefToggle(key)}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                        prefs[key] ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                        prefs[key] ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
        >
          {t('signOut')}
        </button>
      </div>

      <BottomNav />
    </MobileShell>
  );
}
