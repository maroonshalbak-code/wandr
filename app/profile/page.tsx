'use client';

import { useEffect, useState } from 'react';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/context/LanguageContext';
import { LOCALE_NAMES, LOCALE_FLAGS, SupportedLocale } from '@/lib/i18n';
import type { User } from '@supabase/supabase-js';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [langSaved, setLangSaved] = useState(false);
  const { t, locale, setLocale } = useLang();

  const handleLocaleChange = (l: SupportedLocale) => {
    setLocale(l);
    setLangSaved(true);
    setTimeout(() => setLangSaved(false), 2000);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

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
