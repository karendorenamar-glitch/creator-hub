/** Country options shown at registration and used to pick the one-time price. */
export const COUNTRY_CODES = ["ID", "MY", "SG", "US", "GB", "AU", "OTHER"] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export type CountryOption = { code: CountryCode; name: string };

/** Order matters: Indonesia first, everything else is international pricing. */
export const COUNTRIES: CountryOption[] = [
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "OTHER", name: "Other countries" },
];

export const INDONESIA_PRICE_IDR = 30_000;
export const INTERNATIONAL_PRICE_USD = 3;

export function isCountryCode(value: string | null | undefined): value is CountryCode {
  return COUNTRY_CODES.includes((value ?? "") as CountryCode);
}

export function countryName(code: string | null | undefined): string | null {
  return COUNTRIES.find((country) => country.code === code)?.name ?? null;
}

export function isIndonesian(code: string | null | undefined): boolean {
  return code === "ID";
}

/** Server-side source of truth for what a customer must pay. */
export function priceForCountry(code: string | null | undefined) {
  if (isIndonesian(code)) {
    return {
      currency: "IDR" as const,
      amountIdr: INDONESIA_PRICE_IDR,
      amountUsd: 0,
      method: "bank_transfer" as const,
    };
  }
  return {
    currency: "USD" as const,
    amountIdr: 0,
    amountUsd: INTERNATIONAL_PRICE_USD,
    method: "paypal" as const,
  };
}
