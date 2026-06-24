export type AppLocale = "en" | "id";

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "kefoo_locale";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  id: "Bahasa",
};
