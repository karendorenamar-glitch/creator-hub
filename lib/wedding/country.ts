import type { SupabaseClient } from "@supabase/supabase-js";
import { isCountryCode, type CountryCode } from "@/lib/wedding/countries";

/**
 * Reads the country saved in customer_profiles, falling back to the value
 * stored in the auth user metadata at sign-up (used when email confirmation
 * delayed the profile row). Returns null when the customer never picked one.
 */
export async function loadCustomerCountry(
  supabase: SupabaseClient,
  userId: string,
): Promise<CountryCode | null> {
  const { data } = await supabase
    .from("customer_profiles")
    .select("country_code")
    .eq("user_id", userId)
    .maybeSingle();

  const stored = (data as { country_code?: string } | null)?.country_code;
  if (isCountryCode(stored)) return stored;

  const { data: userData } = await supabase.auth.getUser();
  const metadata = userData?.user?.user_metadata as
    | { country_code?: string }
    | undefined;
  if (isCountryCode(metadata?.country_code)) return metadata.country_code;

  return null;
}

export async function saveCustomerCountry(
  supabase: SupabaseClient,
  userId: string,
  countryCode: CountryCode,
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await supabase.from("customer_profiles").upsert(
    { user_id: userId, country_code: countryCode },
    { onConflict: "user_id" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
