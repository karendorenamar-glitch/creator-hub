import Link from "next/link";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { ResetPasswordForm } from "./form";

export const dynamic = "force-dynamic";

export default async function AffiliateResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const supabase = await createWeddingClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[affiliate reset] exchange", error.message);
  }

  const { data } = await supabase.auth.getUser();
  const ready = Boolean(data.user);

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="mt-2 font-heading text-3xl text-ink">Set a new password</h1>
      {ready ? (
        <ResetPasswordForm />
      ) : (
        <div className="mt-6 space-y-3">
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
            This reset link is invalid or has expired.
          </p>
          <Link href="/affiliate/forgot-password" className="inline-block rounded-full bg-rosewood px-5 py-2.5 text-sm text-ivory">
            Request a new link
          </Link>
        </div>
      )}
    </main>
  );
}
