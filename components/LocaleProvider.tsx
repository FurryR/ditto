'use client';

import { NextIntlClientProvider } from 'next-intl';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';
import jaMessages from '@/messages/ja.json';

const SUPPORTED_LOCALES = ['en', 'zh', 'ja'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const MESSAGES: Record<Locale, Record<string, any>> = {
  en: enMessages,
  zh: zhMessages,
  ja: jaMessages,
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
});

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('locale');
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) return stored as Locale;
  const browser = navigator.language?.slice(0, 2) as Locale;
  if (SUPPORTED_LOCALES.includes(browser)) return browser;
  return 'en';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const initial = detectInitialLocale();
    setLocaleState(initial);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initial;
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', next);
      document.documentElement.lang = next;
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  const messages = MESSAGES[locale] || MESSAGES.en;

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
