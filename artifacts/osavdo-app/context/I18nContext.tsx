import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type LangCode,
  type TranslationKey,
  TRANSLATIONS,
  COUNTRY_LANG,
  PHONE_FORMATS,
  type PhoneFormat,
} from '@/constants/i18n';

interface I18nContextType {
  lang: LangCode;
  t: (key: TranslationKey) => string;
  phoneFormat: PhoneFormat;
  setLang: (lang: LangCode) => void;
  setLangByCountry: (countryId: string) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);
const LANG_KEY = 'osavdo_lang';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('uz');

  React.useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved && saved in TRANSLATIONS) setLangState(saved as LangCode);
    });
  }, []);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
  }, []);

  const setLangByCountry = useCallback((countryId: string) => {
    const l = COUNTRY_LANG[countryId] ?? 'uz';
    setLang(l as LangCode);
  }, [setLang]);

  const t = useCallback(
    (key: TranslationKey) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.uz[key] ?? key,
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, t, phoneFormat: PHONE_FORMATS[lang], setLang, setLangByCountry }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
