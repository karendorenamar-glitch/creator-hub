"use client";

import { useActionState } from "react";
import {
  updateAffiliateProfileAction,
  type ProfileState,
} from "@/app/affiliate/profile/actions";

const field =
  "mt-1 w-full rounded-xl border border-blush/70 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rosewood";

export function AffiliateProfileForm({
  fullName,
  instagram,
  tiktok,
  bankName,
  accountHolder,
  accountNumber,
}: {
  fullName: string;
  instagram: string;
  tiktok: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateAffiliateProfileAction,
    null,
  );

  return (
    <form action={action} className="mt-8 space-y-3">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Profile saved.</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-ink sm:col-span-2">
          Full name
          <input name="fullName" required defaultValue={fullName} className={field} />
        </label>
        <label className="text-xs font-medium text-ink">
          Instagram
          <input name="instagram" defaultValue={instagram} className={field} placeholder="@username" />
        </label>
        <label className="text-xs font-medium text-ink">
          TikTok
          <input name="tiktok" defaultValue={tiktok} className={field} placeholder="@username" />
        </label>
        <label className="text-xs font-medium text-ink">
          Bank name
          <input name="bankName" defaultValue={bankName} className={field} />
        </label>
        <label className="text-xs font-medium text-ink">
          Account holder
          <input name="accountHolder" defaultValue={accountHolder} className={field} />
        </label>
        <label className="text-xs font-medium text-ink sm:col-span-2">
          Account number
          <input name="accountNumber" defaultValue={accountNumber} className={field} />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-rosewood px-5 py-2.5 text-sm font-medium text-ivory hover:bg-cocoa disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
      <p className="text-[11px] text-ink-soft">
        Email, referral code and commission settings cannot be changed here.
      </p>
    </form>
  );
}
