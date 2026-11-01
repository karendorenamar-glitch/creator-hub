"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDebtClient } from "@/lib/debt/supabase";
import { getDebtOwner } from "@/lib/debt/auth";
import { isEmail, isUuid, text } from "@/lib/wedding/validation";
import {
  parseDebtAccount,
  parseDebtPayment,
  parseDebtSchedule,
  SCHEDULE_STATUSES,
} from "@/lib/debt/validation";
import type { DebtAccount, DebtScheduleStatus } from "@/lib/debt/db-types";
import { formatRupiah } from "@/lib/debt/format";

export type DebtActionResult = { error?: string; success?: string } | null;
export type DebtAuthState = { error?: string; success?: string } | null;

function messageForError(error: { code?: string; message: string }): string {
  if (error.code === "42501" || error.message.includes("row-level security")) {
    return "Akses ditolak. Akun ini tidak diizinkan mengubah data ini.";
  }
  if (error.code === "23505" || error.message.includes("duplicate key")) {
    return "Data ini sudah tercatat.";
  }
  if (error.code === "23503") {
    return "Akun atau jadwal yang dipilih tidak ditemukan.";
  }
  if (error.code === "23514" || error.code === "22P02") {
    return "Data tidak valid. Periksa kembali isian.";
  }
  return "Terjadi kesalahan saat menyimpan data. Coba lagi.";
}

function revalidateDebt() {
  for (const path of [
    "/debt",
    "/debt/accounts",
    "/debt/payments",
    "/debt/schedule",
  ]) {
    revalidatePath(path);
  }
}

async function actionContext() {
  const owner = await getDebtOwner();
  if (!owner) return null;
  return { owner, supabase: await createDebtClient() };
}

export async function loginDebtAction(
  _prev: DebtAuthState,
  formData: FormData,
): Promise<DebtAuthState> {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isEmail(email) || !password) {
    return { error: "Email atau kata sandi tidak valid." };
  }

  const supabase = await createDebtClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Email atau kata sandi salah." };

  const { data: isOwner, error: ownerError } =
    await supabase.rpc("is_debt_owner");

  if (ownerError || isOwner !== true) {
    await supabase.auth.signOut();
    return { error: "Akun ini tidak memiliki akses ke Debt Tracker." };
  }

  redirect("/debt");
}

export async function logoutDebtAction(): Promise<void> {
  const supabase = await createDebtClient();
  await supabase.auth.signOut();
  redirect("/debt/login");
}

async function findAccount(
  ownerId: string,
  id: string,
): Promise<DebtAccount | null> {
  if (!isUuid(id)) return null;
  const supabase = await createDebtClient();
  const { data } = await supabase
    .from("debt_accounts")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", ownerId)
    .maybeSingle();
  return (data as DebtAccount | null) ?? null;
}

export async function createDebtAccountAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const parsed = parseDebtAccount(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase.from("debt_accounts").insert({
    owner_user_id: ctx.owner.userId,
    ...parsed.values,
  });

  if (error) return { error: messageForError(error) };

  revalidateDebt();
  return { success: "Akun berhasil ditambahkan." };
}

export async function updateDebtAccountAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Akun tidak valid." };

  const parsed = parseDebtAccount(formData);
  if (!parsed.ok) return { error: parsed.error };

  const account = await findAccount(ctx.owner.userId, id);
  if (!account) return { error: "Akun tidak ditemukan." };

  const { data: updated, error } = await ctx.supabase
    .from("debt_accounts")
    .update(parsed.values)
    .eq("id", id)
    .eq("owner_user_id", ctx.owner.userId)
    .select("id")
    .maybeSingle();

  if (error) return { error: messageForError(error) };
  if (!updated) return { error: "Akun tidak ditemukan." };

  revalidateDebt();
  return { success: "Akun berhasil diperbarui." };
}

export async function deleteDebtAccountAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Akun tidak valid." };

  const account = await findAccount(ctx.owner.userId, id);
  if (!account) return { error: "Akun tidak ditemukan." };

  const [{ count: paymentCount }, { count: scheduleCount }] = await Promise.all([
    ctx.supabase
      .from("debt_payments")
      .select("id", { count: "exact", head: true })
      .eq("debt_account_id", id)
      .eq("owner_user_id", ctx.owner.userId),
    ctx.supabase
      .from("debt_schedules")
      .select("id", { count: "exact", head: true })
      .eq("debt_account_id", id)
      .eq("owner_user_id", ctx.owner.userId),
  ]);

  // Never erase payment history. If the account has history, close it instead.
  if ((paymentCount ?? 0) > 0 || (scheduleCount ?? 0) > 0) {
    const { data: closed, error } = await ctx.supabase
      .from("debt_accounts")
      .update({ status: "closed" })
      .eq("id", id)
      .eq("owner_user_id", ctx.owner.userId)
      .select("id")
      .maybeSingle();

    if (error) return { error: messageForError(error) };
    if (!closed) return { error: "Akun tidak ditemukan." };
    revalidateDebt();
    return {
      success:
        "Akun memiliki riwayat, jadi akun ditutup—bukan dihapus. Riwayat pembayaran tetap tersimpan.",
    };
  }

  const { data: deleted, error } = await ctx.supabase
    .from("debt_accounts")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", ctx.owner.userId)
    .select("id")
    .maybeSingle();

  if (error) return { error: messageForError(error) };
  if (!deleted) return { error: "Akun tidak ditemukan." };

  revalidateDebt();
  return { success: "Akun berhasil dihapus." };
}


async function syncAccountStatus(
  ownerId: string,
  accountId: string,
): Promise<void> {
  const supabase = await createDebtClient();
  const { data: account } = await supabase
    .from("debt_accounts")
    .select("id, status, total_amount_due")
    .eq("id", accountId)
    .eq("owner_user_id", ownerId)
    .maybeSingle();

  if (!account || account.status === "closed") return;

  const { data: payments } = await supabase
    .from("debt_payments")
    .select("amount")
    .eq("debt_account_id", accountId)
    .eq("owner_user_id", ownerId)
    .is("reversed_at", null);

  const paid = (payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const nextStatus =
    paid >= Number(account.total_amount_due) ? "paid" : "active";

  if (nextStatus !== account.status) {
    await supabase
      .from("debt_accounts")
      .update({ status: nextStatus })
      .eq("id", accountId)
      .eq("owner_user_id", ownerId);
  }
}

async function syncScheduleStatus(
  ownerId: string,
  scheduleId: string,
): Promise<void> {
  const supabase = await createDebtClient();
  const { data: schedule } = await supabase
    .from("debt_schedules")
    .select("id, status, amount_due, debt_account_id")
    .eq("id", scheduleId)
    .eq("owner_user_id", ownerId)
    .maybeSingle();

  if (!schedule || schedule.status === "cancelled") return;

  const { data: payments } = await supabase
    .from("debt_payments")
    .select("amount")
    .eq("schedule_id", scheduleId)
    .eq("owner_user_id", ownerId)
    .is("reversed_at", null);

  const paid = (payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const nextStatus =
    paid >= Number(schedule.amount_due) ? "paid" : "upcoming";

  if (nextStatus !== schedule.status) {
    await supabase
      .from("debt_schedules")
      .update({ status: nextStatus })
      .eq("id", scheduleId)
      .eq("owner_user_id", ownerId);
  }
}

export async function createDebtPaymentAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const parsed = parseDebtPayment(formData);
  if (!parsed.ok) return { error: parsed.error };

  const account = await findAccount(
    ctx.owner.userId,
    parsed.values.debt_account_id,
  );
  if (!account) return { error: "Akun tidak ditemukan." };
  if (account.status === "closed") {
    return { error: "Akun yang sudah ditutup tidak dapat menerima pembayaran." };
  }

  const { data: accountPayments } = await ctx.supabase
    .from("debt_payments")
    .select("amount")
    .eq("debt_account_id", account.id)
    .eq("owner_user_id", ctx.owner.userId)
    .is("reversed_at", null);

  const alreadyPaidRecorded = (accountPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const scheduledPaid =
    Number(account.installment_amount ?? 0) > 0 &&
    Number(account.installment_total_months ?? 0) > 0
      ? Number(account.installment_amount) *
        Math.min(
          Number(account.installment_month ?? 0),
          Number(account.installment_total_months),
        )
      : 0;
  const alreadyPaid = Math.max(alreadyPaidRecorded, scheduledPaid);
  const accountRemaining = Math.max(
    0,
    Number(account.total_amount_due) - alreadyPaid,
  );
  if (parsed.values.amount > accountRemaining) {
    return {
      error: `Nominal melebihi sisa akun (${formatRupiah(accountRemaining)}).`,
    };
  }

  if (parsed.values.schedule_id) {
    const { data: schedule } = await ctx.supabase
      .from("debt_schedules")
      .select("id, debt_account_id")
      .eq("id", parsed.values.schedule_id)
      .eq("debt_account_id", parsed.values.debt_account_id)
      .eq("owner_user_id", ctx.owner.userId)
      .maybeSingle();

    if (!schedule) {
      return { error: "Jadwal tidak sesuai dengan akun yang dipilih." };
    }
  }

  const { error } = await ctx.supabase.from("debt_payments").insert({
    owner_user_id: ctx.owner.userId,
    ...parsed.values,
  });

  if (error) {
    // A repeated request with the same idempotency key is a safe no-op.
    if (error.code === "23505" && parsed.values.idempotency_key) {
      const { data: existing } = await ctx.supabase
        .from("debt_payments")
        .select("id")
        .eq("owner_user_id", ctx.owner.userId)
        .eq("idempotency_key", parsed.values.idempotency_key)
        .maybeSingle();
      if (existing) return { success: "Pembayaran sudah tercatat." };
    }
    return { error: messageForError(error) };
  }

  try {
    await syncAccountStatus(ctx.owner.userId, parsed.values.debt_account_id);
    if (parsed.values.schedule_id) {
      await syncScheduleStatus(ctx.owner.userId, parsed.values.schedule_id);
    }
  } catch {
    revalidateDebt();
    return {
      error:
        "Pembayaran tersimpan, tetapi status otomatis gagal diperbarui. Muat ulang halaman.",
    };
  }

  revalidateDebt();
  return { success: "Pembayaran berhasil dicatat." };
}

export async function reverseDebtPaymentAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Pembayaran tidak valid." };

  const { data: payment } = await ctx.supabase
    .from("debt_payments")
    .select("id, debt_account_id, schedule_id, reversed_at")
    .eq("id", id)
    .eq("owner_user_id", ctx.owner.userId)
    .maybeSingle();

  if (!payment) return { error: "Pembayaran tidak ditemukan." };
  if (payment.reversed_at) return { error: "Pembayaran ini sudah dibatalkan." };

  const reason =
    text(formData, "reason").slice(0, 500) || "Dibatalkan oleh pemilik akun";

  const { error } = await ctx.supabase
    .from("debt_payments")
    .update({
      reversed_at: new Date().toISOString(),
      reversal_reason: reason,
    })
    .eq("id", id)
    .eq("owner_user_id", ctx.owner.userId)
    .is("reversed_at", null);

  if (error) return { error: messageForError(error) };

  try {
    await syncAccountStatus(ctx.owner.userId, payment.debt_account_id);
    if (payment.schedule_id) {
      await syncScheduleStatus(ctx.owner.userId, payment.schedule_id);
    }
  } catch {
    revalidateDebt();
    return {
      error:
        "Pembayaran dibatalkan, tetapi status otomatis gagal diperbarui. Muat ulang halaman.",
    };
  }

  revalidateDebt();
  return { success: "Pembayaran dibatalkan dan riwayatnya tetap tersimpan." };
}

export async function createDebtScheduleAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const parsed = parseDebtSchedule(formData);
  if (!parsed.ok) return { error: parsed.error };

  const account = await findAccount(
    ctx.owner.userId,
    parsed.values.debt_account_id,
  );
  if (!account) return { error: "Akun tidak ditemukan." };
  if (account.status === "closed") {
    return { error: "Akun yang sudah ditutup tidak dapat menerima jadwal baru." };
  }

  const { error } = await ctx.supabase.from("debt_schedules").insert({
    owner_user_id: ctx.owner.userId,
    ...parsed.values,
    status: "upcoming",
  });

  if (error) return { error: messageForError(error) };

  revalidateDebt();
  return { success: "Jadwal berhasil ditambahkan." };
}

export async function updateDebtScheduleStatusAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  const rawStatus = text(formData, "status");
  if (!isUuid(id)) return { error: "Jadwal tidak valid." };

  const status: DebtScheduleStatus | null =
    rawStatus === "paid" || rawStatus === "cancelled" || rawStatus === "upcoming"
      ? rawStatus
      : null;
  if (!status || !SCHEDULE_STATUSES.includes(status)) {
    return { error: "Status jadwal tidak valid." };
  }

  const { data: updated, error } = await ctx.supabase
    .from("debt_schedules")
    .update({ status })
    .eq("id", id)
    .eq("owner_user_id", ctx.owner.userId)
    .select("id")
    .maybeSingle();

  if (error) return { error: messageForError(error) };
  if (!updated) return { error: "Jadwal tidak ditemukan." };

  revalidateDebt();
  return { success: "Status jadwal diperbarui." };
}
