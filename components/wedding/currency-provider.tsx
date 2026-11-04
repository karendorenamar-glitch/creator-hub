"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  createMoneyFormatter,
  type MoneyFormatter,
} from "@/lib/currency/format";
import type { RateTable } from "@/lib/currency/rates";
import type { CurrencyCode } from "@/lib/currency/currencies";
import { setDisplayCurrencyAction } from "@/app/wedding/actions";

/**
 * Reactive display-currency store.
 *
 * The database stays the source of truth for the preference and every base
 * amount stays in IDR. This store only decides how base amounts render, so
 * switching currency never rewrites stored money.
 */
export type MoneyStore = MoneyFormatter & {
  /** A preference save is in flight; forms must not submit meanwhile. */
  pending: boolean;
  /** Last switch failure, shown inline until dismissed. */
  error: string | null;
  /** Increments after every successful switch so open forms can reset. */
  revision: number;
  setCurrency: (next: CurrencyCode) => Promise<boolean>;
  clearError: () => void;
};

const MoneyContext = createContext<MoneyStore | null>(null);

export function CurrencyProvider({
  currency: serverCurrency,
  rates,
  ratesAvailable,
  fetchedAt,
  children,
}: {
  currency: CurrencyCode;
  rates: Record<string, number> | null;
  ratesAvailable: boolean;
  fetchedAt: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [currency, setCurrencyState] = useState<CurrencyCode>(serverCurrency);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [serverSeen, setServerSeen] = useState<CurrencyCode>(serverCurrency);

  // Follow what the server rendered (navigation, revalidation, another tab)
  // without clobbering an optimistic switch that is still being saved. This is
  // the documented "adjust state during render" pattern, so it stays in sync
  // in the same paint instead of one frame later.
  if (!pending && serverSeen !== serverCurrency) {
    setServerSeen(serverCurrency);
    setCurrencyState(serverCurrency);
  }

  // Another tab may have changed the preference. Re-read it when this tab gets
  // focus, so a form opened elsewhere cannot be saved under a stale currency.
  useEffect(() => {
    const resync = () => {
      if (document.visibilityState !== "visible") return;
      startTransition(() => router.refresh());
    };
    window.addEventListener("focus", resync);
    document.addEventListener("visibilitychange", resync);
    return () => {
      window.removeEventListener("focus", resync);
      document.removeEventListener("visibilitychange", resync);
    };
  }, [router]);

  const setCurrency = useCallback(
    async (next: CurrencyCode): Promise<boolean> => {
      if (next === currency) return true;

      // Never guess a rate: without a usable rate the old currency stays.
      if (next !== "IDR") {
        const rate = (rates as RateTable | null)?.[next];
        if (!ratesAvailable || !rate || !Number.isFinite(rate) || rate <= 0) {
          setError(
            "Kurs mata uang belum tersedia. Mata uang sebelumnya tetap dipakai.",
          );
          return false;
        }
      }

      const previous = currency;
      setError(null);
      setPending(true);
      setCurrencyState(next);

      const result = await setDisplayCurrencyAction(next).catch(() => ({
        ok: false as const,
        error: "Mata uang gagal disimpan. Coba lagi.",
      }));

      if (!result.ok) {
        // Roll back: the UI must never show an unsaved currency.
        setCurrencyState(previous);
        setPending(false);
        setError(result.error);
        return false;
      }

      setRevision((value) => value + 1);
      setPending(false);
      // Refresh server-rendered money that cannot read this context.
      startTransition(() => router.refresh());
      return true;
    },
    [currency, rates, ratesAvailable, router],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<MoneyStore>(() => {
    const formatter = createMoneyFormatter(
      currency,
      rates as RateTable | null,
      ratesAvailable,
      fetchedAt,
    );
    return {
      ...formatter,
      pending,
      error,
      revision,
      setCurrency,
      clearError,
    };
  }, [
    currency,
    rates,
    ratesAvailable,
    fetchedAt,
    pending,
    error,
    revision,
    setCurrency,
    clearError,
  ]);

  return (
    <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>
  );
}

/** Formats wedding amounts in the customer's chosen display currency. */
export function useMoney(): MoneyStore {
  const value = useContext(MoneyContext);
  if (value) return value;
  // Safe fallback for any component rendered outside the provider.
  return {
    ...createMoneyFormatter("IDR", null, false, null),
    pending: false,
    error: null,
    revision: 0,
    setCurrency: async () => false,
    clearError: () => {},
  };
}
