import { cookies } from "next/headers";
import { LOCALE_COOKIE, type AppLocale } from "./types";

/**
 * Seeds the language cookie once, from the customer's country, without ever
 * overwriting a language the visitor picked explicitly. Indonesian customers
 * keep Indonesian; everybody else gets English.
 */
export async function seedLocaleFromCountry(
  country: string | null | undefined,
): Promise<void> {
  if (!country) return;

  const store = await cookies();
  if (store.get(LOCALE_COOKIE)) return;

  const locale: AppLocale = country === "ID" ? "id" : "en";
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
