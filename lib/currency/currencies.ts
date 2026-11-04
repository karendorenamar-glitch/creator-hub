/** The only display currencies Kefoo supports. */
export const CURRENCY_CODES = [
  "IDR",
  "USD",
  "MYR",
  "SGD",
  "AUD",
  "GBP",
  "EUR",
  "JPY",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export type CurrencyOption = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  locale: string;
  decimals: 0 | 2;
  region: string;
};

export const CURRENCIES: CurrencyOption[] = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩", locale: "id-ID", decimals: 0, region: "Indonesia" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", locale: "en-US", decimals: 2, region: "United States" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾", locale: "ms-MY", decimals: 2, region: "Malaysia" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", locale: "en-SG", decimals: 2, region: "Singapore" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", locale: "en-AU", decimals: 2, region: "Australia" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", locale: "en-GB", decimals: 2, region: "United Kingdom" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", locale: "de-DE", decimals: 2, region: "Europe" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", locale: "ja-JP", decimals: 0, region: "Japan" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "IDR";

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return CURRENCY_CODES.includes((value ?? "") as CurrencyCode);
}

export function currencyOption(code: string | null | undefined): CurrencyOption {
  return (
    CURRENCIES.find((item) => item.code === code) ??
    CURRENCIES.find((item) => item.code === DEFAULT_CURRENCY)!
  );
}

/** Country-based default: ID→IDR, MY→MYR, SG→SGD, AU→AUD, others→USD. */
export function defaultCurrencyForCountry(
  country: string | null | undefined,
): CurrencyCode {
  switch (country) {
    case "ID":
      return "IDR";
    case "MY":
      return "MYR";
    case "SG":
      return "SGD";
    case "AU":
      return "AUD";
    default:
      return "USD";
  }
}
