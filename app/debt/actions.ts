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
  parseDebtScheduleBatch,
  parseDebtScheduleUpdate,
  SCHEDULE_STATUSES,
} from "@/lib/debt/validation";
import type {
  DebtAccount,
  DebtPayment,
  DebtSchedule,
  DebtScheduleStatus,
} from "@/lib/debt/db-types";
import { dueDateForMonth, formatRupiah, todayISO } from "@/lib/debt/format";
import { paidByScheduleId } from "@/lib/debt/ledger";

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
    return "Akun atau angsuran yang dipilih tidak ditemukan.";
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

async function findSchedule(
  ownerId: string,
  id: string,
): Promise<DebtSchedule | null> {
  if (!isUuid(id)) return null;
  const supabase = await createDebtClient();
  const { data } = await supabase
    .from("debt_schedules")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", ownerId)
    .maybeSingle();
  return (data as DebtSchedule | null) ?? null;
}

async function schedulePayments(
  ownerId: string,
  scheduleId: string,
): Promise<DebtPayment[]> {
  const supabase = await createDebtClient();
  const { data } = await supabase
    .from("debt_payments")
    .select("*")
    .eq("schedule_id", scheduleId)
    .eq("owner_user_id", ownerId)
    .is("reversed_at", null);
  return (data ?? []) as DebtPayment[];
}

/**
 * Account status is derived from its installments. It never marks an account
 * paid while a tracked installment still has a remaining balance.
 */
async function refreshAccountStatus(
  ownerId: string,
  accountId: string,
): Promise<void> {
  const supabase = await createDebtClient();
  const { data: account } = await supabase
    .from("debt_accounts")
    .select("id, status")
    .eq("id", accountId)
    .eq("owner_user_id", ownerId)
    .maybeSingle();

  if (!account || account.status === "closed") return;

  const [{ data: schedules }, { data: payments }] = await Promise.all([
    supabase
      .from("debt_schedules")
      .select("id, amount_due")
      .eq("debt_account_id", accountId)
      .eq("owner_user_id", ownerId)
      .neq("status", "cancelled"),
    supabase
      .from("debt_payments")
      .select("amount, schedule_id")
      .eq("debt_account_id", accountId)
      .eq("owner_user_id", ownerId)
      .is("reversed_at", null),
  ]);

  const tracked = schedules ?? [];
  if (tracked.length === 0) return;

  const paidMap = paidByScheduleId((payments ?? []) as DebtPayment[]);
  const settled = tracked.every(
    (schedule) =>
      (paidMap.get(schedule.id) ?? 0) >= Number(schedule.amount_due),
  );
  const nextStatus: "paid" | "active" = settled ? "paid" : "active";

  if (nextStatus !== account.status) {
    await supabase
      .from("debt_accounts")
      .update({ status: nextStatus })
      .eq("id", accountId)
      .eq("owner_user_id", ownerId);
  }
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
  return {
    success: "Utang dibuat. Tambahkan angsuran di halaman Jadwal.",
  };
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
        "Akun memiliki riwayat, jadi akun ditutup-bukan dihapus. Riwayat pembayaran tetap tersimpan.",
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

async function accountForPayment(
  ownerId: string,
  accountId: string,
): Promise<DebtAccount | null> {
  const account = await findAccount(ownerId, accountId);
  if (!account) return null;
  if (account.status === "closed") return null;
  return account;
}

export async function createDebtPaymentAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const parsed = parseDebtPayment(formData);
  if (!parsed.ok) return { error: parsed.error };

  const account = await accountForPayment(
    ctx.owner.userId,
    parsed.values.debt_account_id,
  );
  if (!account) {
    return { error: "Akun tidak ditemukan atau sudah ditutup." };
  }

  const { count: trackedInstallments } = await ctx.supabase
    .from("debt_schedules")
    .select("id", { count: "exact", head: true })
    .eq("debt_account_id", account.id)
    .eq("owner_user_id", ctx.owner.userId)
    .neq("status", "cancelled");

  if (!parsed.values.schedule_id) {
    if ((trackedInstallments ?? 0) > 0) {
      return {
        error: "Pilih angsuran yang dibayar agar sisa tagihan tetap akurat.",
      };
    }
  } else {
    const schedule = await findSchedule(
      ctx.owner.userId,
      parsed.values.schedule_id,
    );
    if (!schedule || schedule.debt_account_id !== account.id) {
      return { error: "Angsuran tidak sesuai dengan akun yang dipilih." };
    }
    if (schedule.status === "cancelled") {
      return { error: "Angsuran ini sudah dibatalkan." };
    }

    const installments = await schedulePayments(
      ctx.owner.userId,
      schedule.id,
    );
    const paid = paidByScheduleId(installments).get(schedule.id) ?? 0;
    const remaining = Math.max(0, Number(schedule.amount_due) - paid);

    if (remaining <= 0) return { error: "Angsuran ini sudah lunas." };
    if (parsed.values.amount > remaining) {
      return {
        error: `Nominal melebihi sisa angsuran (${formatRupiah(remaining)}).`,
      };
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
    await refreshAccountStatus(ctx.owner.userId, account.id);
  } catch {
    revalidateDebt();
    return {
      error:
        "Pembayaran tersimpan, tetapi status akun gagal diperbarui. Muat ulang halaman.",
    };
  }

  revalidateDebt();
  return { success: "Pembayaran berhasil dicatat." };
}

export async function payDebtInstallmentAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Angsuran tidak valid." };

  const schedule = await findSchedule(ctx.owner.userId, id);
  if (!schedule) return { error: "Angsuran tidak ditemukan." };

  const account = await accountForPayment(
    ctx.owner.userId,
    schedule.debt_account_id,
  );
  if (!account) return { error: "Akun tidak ditemukan atau sudah ditutup." };
  if (schedule.status === "cancelled") {
    return { error: "Angsuran ini sudah dibatalkan." };
  }

  const payments = await schedulePayments(ctx.owner.userId, schedule.id);
  const paid = paidByScheduleId(payments).get(schedule.id) ?? 0;
  const remaining = Math.max(0, Number(schedule.amount_due) - paid);
  if (remaining <= 0) return { error: "Angsuran ini sudah lunas." };

  const key = `schedule:${schedule.id}:${paid}:${remaining}`;
  const { data: existing } = await ctx.supabase
    .from("debt_payments")
    .select("id")
    .eq("owner_user_id", ctx.owner.userId)
    .eq("idempotency_key", key)
    .maybeSingle();
  if (existing) return { success: "Pembayaran angsuran ini sudah tercatat." };

  const { error } = await ctx.supabase.from("debt_payments").insert({
    owner_user_id: ctx.owner.userId,
    debt_account_id: account.id,
    schedule_id: schedule.id,
    amount: remaining,
    payment_date: todayISO(),
    payment_method: "installment",
    reference: `Angsuran ${schedule.due_date}`,
    idempotency_key: key,
  });

  if (error) return { error: messageForError(error) };

  try {
    await refreshAccountStatus(ctx.owner.userId, account.id);
  } catch {
    revalidateDebt();
    return {
      error:
        "Pembayaran tersimpan, tetapi status akun gagal diperbarui. Muat ulang halaman.",
    };
  }

  revalidateDebt();
  return {
    success: `Angsuran ${formatRupiah(remaining)} tercatat lunas.`,
  };
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
    await refreshAccountStatus(ctx.owner.userId, payment.debt_account_id);
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
    return { error: "Akun yang sudah ditutup tidak dapat menerima angsuran baru." };
  }

  const { error } = await ctx.supabase.from("debt_schedules").insert({
    owner_user_id: ctx.owner.userId,
    ...parsed.values,
    status: "upcoming",
  });

  if (error) return { error: messageForError(error) };

  await refreshAccountStatus(ctx.owner.userId, account.id);
  revalidateDebt();
  return { success: "Angsuran berhasil ditambahkan." };
}

export async function createDebtScheduleBatchAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const parsed = parseDebtScheduleBatch(formData);
  if (!parsed.ok) return { error: parsed.error };

  const account = await findAccount(
    ctx.owner.userId,
    parsed.values.debt_account_id,
  );
  if (!account) return { error: "Akun tidak ditemukan." };
  if (account.status === "closed") {
    return { error: "Akun yang sudah ditutup tidak dapat menerima angsuran baru." };
  }

  const [year, month] = parsed.values.start_month.split("-").map(Number);
  const rows = Array.from({ length: parsed.values.count }, (_, index) => {
    const offset = index;
    const date = new Date(Date.UTC(year, month - 1 + offset, 1));
    const monthKeyValue = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    return {
      owner_user_id: ctx.owner.userId,
      debt_account_id: parsed.values.debt_account_id,
      due_date: dueDateForMonth(parsed.values.due_day, monthKeyValue),
      amount_due: parsed.values.amount_due,
      notes: parsed.values.notes,
      status: "upcoming" as DebtScheduleStatus,
    };
  });

  const { error } = await ctx.supabase.from("debt_schedules").insert(rows);
  if (error) return { error: messageForError(error) };

  await refreshAccountStatus(ctx.owner.userId, account.id);
  revalidateDebt();
  return {
    success: `${rows.length} angsuran dibuat. Ubah nominal masing-masing jika berbeda.`,
  };
}

export async function updateDebtScheduleAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const parsed = parseDebtScheduleUpdate(formData);
  if (!parsed.ok) return { error: parsed.error };

  const schedule = await findSchedule(ctx.owner.userId, parsed.values.id);
  if (!schedule) return { error: "Angsuran tidak ditemukan." };

  const payments = await schedulePayments(ctx.owner.userId, schedule.id);
  const paid = paidByScheduleId(payments).get(schedule.id) ?? 0;
  if (paid > 0) {
    return {
      error:
        "Angsuran yang sudah memiliki pembayaran tidak dapat diubah. Batalkan pembayarannya terlebih dahulu.",
    };
  }

  const { data: updated, error } = await ctx.supabase
    .from("debt_schedules")
    .update({
      due_date: parsed.values.due_date,
      amount_due: parsed.values.amount_due,
      notes: parsed.values.notes,
    })
    .eq("id", schedule.id)
    .eq("owner_user_id", ctx.owner.userId)
    .select("id")
    .maybeSingle();

  if (error) return { error: messageForError(error) };
  if (!updated) return { error: "Angsuran tidak ditemukan." };

  revalidateDebt();
  return { success: "Angsuran berhasil diperbarui." };
}

export async function deleteDebtScheduleAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Angsuran tidak valid." };

  const schedule = await findSchedule(ctx.owner.userId, id);
  if (!schedule) return { error: "Angsuran tidak ditemukan." };

  const payments = await schedulePayments(ctx.owner.userId, schedule.id);
  const paid = paidByScheduleId(payments).get(schedule.id) ?? 0;

  // Keep history: an installment that already has payments is cancelled.
  if (paid > 0) {
    const { error } = await ctx.supabase
      .from("debt_schedules")
      .update({ status: "cancelled" })
      .eq("id", schedule.id)
      .eq("owner_user_id", ctx.owner.userId);
    if (error) return { error: messageForError(error) };

    await refreshAccountStatus(ctx.owner.userId, schedule.debt_account_id);
    revalidateDebt();
    return {
      success:
        "Angsuran memiliki pembayaran, jadi dibatalkan-bukan dihapus. Riwayat tetap tersimpan.",
    };
  }

  const { error } = await ctx.supabase
    .from("debt_schedules")
    .delete()
    .eq("id", schedule.id)
    .eq("owner_user_id", ctx.owner.userId);

  if (error) return { error: messageForError(error) };

  await refreshAccountStatus(ctx.owner.userId, schedule.debt_account_id);
  revalidateDebt();
  return { success: "Angsuran dihapus." };
}

export async function updateDebtScheduleStatusAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  const status = text(formData, "status") as DebtScheduleStatus;
  if (!isUuid(id) || !SCHEDULE_STATUSES.includes(status)) {
    return { error: "Angsuran tidak valid." };
  }

  const schedule = await findSchedule(ctx.owner.userId, id);
  if (!schedule) return { error: "Angsuran tidak ditemukan." };

  // Paid status is derived from payments, never set by hand.
  if (status === "paid") {
    return { error: "Status lunas hanya berubah dari pembayaran yang dicatat." };
  }

  if (status === "cancelled") {
    const payments = await schedulePayments(ctx.owner.userId, schedule.id);
    const paid = paidByScheduleId(payments).get(schedule.id) ?? 0;
    if (paid > 0) {
      return {
        error: "Batalkan pembayaran angsuran ini dulu sebelum membatalkan angsurannya.",
      };
    }
  }

  const { data: updated, error } = await ctx.supabase
    .from("debt_schedules")
    .update({ status })
    .eq("id", id)
    .eq("owner_user_id", ctx.owner.userId)
    .select("id")
    .maybeSingle();

  if (error) return { error: messageForError(error) };
  if (!updated) return { error: "Angsuran tidak ditemukan." };

  await refreshAccountStatus(ctx.owner.userId, schedule.debt_account_id);
  revalidateDebt();
  return { success: "Status angsuran diperbarui." };
}
