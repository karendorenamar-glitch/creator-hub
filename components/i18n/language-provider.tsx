"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { setLocale as setLocaleAction } from "@/app/actions/locale";
import {
  formatMessage,
  getMessage,
  type MessageKey,
} from "@/lib/i18n/messages";
import type { AppLocale } from "@/lib/i18n/types";

type LanguageContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: MessageKey, params?: Record<string, string>) => string;
  isChangingLocale: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

type LanguageProviderProps = {
  initialLocale: AppLocale;
  children: ReactNode;
};

export function LanguageProvider({
  initialLocale,
  children,
}: LanguageProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);
  const [isChangingLocale, startTransition] = useTransition();

  const setLocale = useCallback((nextLocale: AppLocale) => {
    startTransition(async () => {
      await setLocaleAction(nextLocale);
      setLocaleState(nextLocale);
      router.refresh();
    });
  }, [router]);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string>) =>
      params ? formatMessage(locale, key, params) : getMessage(locale, key),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isChangingLocale,
    }),
    [isChangingLocale, locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
