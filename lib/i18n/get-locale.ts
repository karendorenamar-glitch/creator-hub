import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type AppLocale,
} from "@/lib/i18n/types";

export function parseLocale(value: string | undefined | null): AppLocale {
  return value === "id" ? "id" : DEFAULT_LOCALE;
}

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
