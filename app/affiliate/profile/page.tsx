import Link from "next/link";
import { redirect } from "next/navigation";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { loadAffiliate } from "@/lib/affiliate/session";
import { AffiliateProfileForm } from "@/components/affiliate/profile-form";

const mask = (value: string | null) =>
  value && value.length >= 4 ? `•••• ${value.slice(-4)}` : "Not set";

export default async function AffiliateProfilePage() {
  const supabase = await createWeddingClient();
  const affiliate = await loadAffiliate(supabase);
  if (!affiliate) redirect("/affiliate/login");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <h1 className="font-heading text-3xl text-ink">Profile</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Referral code <strong>{affiliate.referral_code}</strong> · account stays
        active unless Kefoo suspends it.
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        Saved bank account: {mask(affiliate.bank_account_number)}
      </p>

      <AffiliateProfileForm
        fullName={affiliate.full_name}
        instagram={affiliate.instagram_username ?? ""}
        tiktok={affiliate.tiktok_username ?? ""}
        bankName={affiliate.bank_name ?? ""}
        accountHolder={affiliate.account_holder_name ?? ""}
        accountNumber={affiliate.bank_account_number ?? ""}
      />

      <Link href="/affiliate/dashboard" className="mt-8 inline-block text-xs text-ink-soft underline">
        ← Back to dashboard
      </Link>
    </main>
  );
}
