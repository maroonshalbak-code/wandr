'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { translations, LOCALE_NAMES, LOCALE_FLAGS, SupportedLocale } from '@/lib/i18n';

interface LangContextValue {
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  t: (key: string) => string;
  localeNames: typeof LOCALE_NAMES;
  localeFlags: typeof LOCALE_FLAGS;
  isRTL: boolean;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  // Load saved language on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wandr-locale') as SupportedLocale;
      if (saved && saved in LOCALE_NAMES) setLocaleState(saved);
    } catch { /* SSR guard */ }
  }, []);

  // Apply RTL direction + persist whenever locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('wandr-locale', locale); } catch { /* ignore */ }
  }, [locale]);

  const setLocale = useCallback((l: SupportedLocale) => setLocaleState(l), []);

  // Only rebuild these when locale changes — ensures consumers re-render
  const value = useMemo<LangContextValue>(() => ({
    locale,
    setLocale,
    t: (key: string) => translations[locale][key] ?? translations.en[key] ?? key,
    localeNames: LOCALE_NAMES,
    localeFlags: LOCALE_FLAGS,
    isRTL: locale === 'ar',
  }), [locale, setLocale]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
