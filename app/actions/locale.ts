"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, type AppLocale } from "@/lib/i18n/types";
import { parseLocale } from "@/lib/i18n/get-locale";

export async function setLocale(locale: AppLocale) {
  const nextLocale = parseLocale(locale);
  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE, nextLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
