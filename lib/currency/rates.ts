import { CURRENCY_CODES, type CurrencyCode } from "./currencies";

/** Rates are quoted as 1 IDR = X currency. */
export type RateTable = Record<CurrencyCode, number>;

export type ExchangeRates = {
  available: boolean;
  base: "IDR";
  rates: RateTable | null;
  fetchedAt: string | null;
};

const RATE_URL = "https://open.er-api.com/v6/latest/IDR";
const CACHE_MS = 6 * 60 * 60 * 1000; // refresh every six hours

let memoryCache: { table: RateTable; fetchedAt: string; at: number } | null = null;

function emptyTable(): RateTable {
  return Object.fromEntries(CURRENCY_CODES.map((code) => [code, 0])) as RateTable;
}

/**
 * Exchange rates for the display currency. Cached in memory and in the Next
 * fetch cache; a failed request returns unavailable instead of a wrong number.
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  if (memoryCache && Date.now() - memoryCache.at < CACHE_MS) {
    return {
      available: true,
      base: "IDR",
      rates: memoryCache.table,
      fetchedAt: memoryCache.fetchedAt,
    };
  }

  try {
    const response = await fetch(RATE_URL, {
      next: { revalidate: CACHE_MS / 1000 },
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`rate request failed: ${response.status}`);

    const payload = (await response.json()) as {
      result?: string;
      time_last_update_unix?: number;
      rates?: Record<string, number>;
    };
    if (payload.result !== "success" || !payload.rates) {
      throw new Error("rate payload invalid");
    }

    const table = emptyTable();
    table.IDR = 1;
    for (const code of CURRENCY_CODES) {
      if (code === "IDR") continue;
      const value = Number(payload.rates[code]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`missing rate for ${code}`);
      }
      table[code] = value;
    }

    const fetchedAt = payload.time_last_update_unix
      ? new Date(payload.time_last_update_unix * 1000).toISOString()
      : new Date().toISOString();

    memoryCache = { table, fetchedAt, at: Date.now() };

    return { available: true, base: "IDR", rates: table, fetchedAt };
  } catch (error) {
    console.error("[currency] exchange rates unavailable", error);
    if (memoryCache) {
      return {
        available: true,
        base: "IDR",
        rates: memoryCache.table,
        fetchedAt: memoryCache.fetchedAt,
      };
    }
    return { available: false, base: "IDR", rates: null, fetchedAt: null };
  }
}
