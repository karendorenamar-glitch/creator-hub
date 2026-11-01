"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDebtClient } from "@/lib/debt/supabase";
import { getDebtOwner } from "@/lib/debt/auth";
import { isEmail, isUuid, parseWholeRupiah, text } from "@/lib/wedding/validation";
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
import {
  addMonthsISO,
  dueDateForMonth,
  formatRupiah,
  nextDueDateForDay,
  todayISO,
} from "@/lib/debt/format";
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

function diagnostic(error: { code?: string; message: string }): string {
  return `${messageForError(error)} [${error.code ?? "?"}: ${error.message}]`;
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
  prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  try {
    return await createDebtAccount(prev, formData);
  } catch {
    return {
      error:
        "Penyimpanan gagal karena kesalahan tak terduga. Coba lagi atau periksa isian.",
    };
  }
}

async function createDebtAccount(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const parsed = parseDebtAccount(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { data: created, error } = await ctx.supabase
    .from("debt_accounts")
    .insert({
      owner_user_id: ctx.owner.userId,
      ...parsed.values,
    })
    .select("id, due_date")
    .maybeSingle();

  if (error) return { error: diagnostic(error) };

  if (!created) return { error: "Utang gagal disimpan. Coba lagi." };

  revalidateDebt();
  return { success: "Utang berhasil disimpan." };
}

export async function updateDebtAccountAction(
  prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  try {
    return await updateDebtAccount(prev, formData);
  } catch {
    return {
      error:
        "Penyimpanan gagal karena kesalahan tak terduga. Coba lagi atau periksa isian.",
    };
  }
}

async function updateDebtAccount(
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
  return { success: "Utang berhasil diperbarui." };
}

/**
 * Converts debts that still use the older tenor columns into real installment
 * rows so they can be paid per month. Safe to repeat: debts that already have
 * installments are skipped.
 */
export async function materializeLegacySchedulesAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  const onlySingle = isUuid(id);
  const { data: accounts, error: accountsError } = await ctx.supabase
    .from("debt_accounts")
    .select("*")
    .eq("owner_user_id", ctx.owner.userId)
    .neq("status", "closed");

  if (accountsError) return { error: messageForError(accountsError) };

  const targets = ((accounts ?? []) as DebtAccount[]).filter(
    (account) => (!onlySingle || account.id === id) && Number(account.total_amount_due) > 0,
  );

  if (targets.length === 0) {
    return { error: "Tidak ada utang tenor lama yang perlu dikonversi." };
  }

  const today = todayISO();
  let created = 0;

  for (const account of targets) {
    const { count } = await ctx.supabase
      .from("debt_schedules")
      .select("id", { count: "exact", head: true })
      .eq("debt_account_id", account.id)
      .eq("owner_user_id", ctx.owner.userId);

    if ((count ?? 0) > 0) continue;

    const { data: accountPayments } = await ctx.supabase
      .from("debt_payments")
      .select("amount")
      .eq("debt_account_id", account.id)
      .eq("owner_user_id", ctx.owner.userId)
      .is("reversed_at", null);
    const recordedPaid = (accountPayments ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const totalMonths = Number(account.installment_total_months);
    const amount = Number(account.installment_amount);
    let rows: {
      owner_user_id: string;
      debt_account_id: string;
      due_date: string;
      amount_due: number;
      notes: string | null;
      status: DebtScheduleStatus;
    }[] = [];

    if (amount > 0 && totalMonths > Number(account.installment_month)) {
      const paidMonths = Math.min(
        Math.max(Number(account.installment_month), 0),
        totalMonths,
      );
      const openMonths = totalMonths - paidMonths;
      const start =
        account.due_date ??
        nextDueDateForDay(Number(account.due_day ?? 1), today);
      rows = Array.from({ length: openMonths }, (_, index) => ({
        owner_user_id: ctx.owner.userId,
        debt_account_id: account.id,
        due_date: addMonthsISO(start, index),
        amount_due: amount,
        notes: "Dibuat dari tenor lama",
        status: "upcoming" as DebtScheduleStatus,
      }));
    } else {
      const remaining = Math.max(
        0,
        Number(account.total_amount_due) - recordedPaid,
      );
      if (remaining <= 0) continue;
      rows = [
        {
          owner_user_id: ctx.owner.userId,
          debt_account_id: account.id,
          due_date: account.due_date ?? today,
          amount_due: remaining,
          notes: "Dibuat dari sisa tagihan",
          status: "upcoming" as DebtScheduleStatus,
        },
      ];
    }

    const { error } = await ctx.supabase.from("debt_schedules").insert(rows);
    if (error) return { error: messageForError(error) };
    created += rows.length;

    await refreshAccountStatus(ctx.owner.userId, account.id);
  }

  if (created === 0) {
    return { error: "Utang ini sudah punya jadwal angsuran." };
  }

  revalidateDebt();
  return {
    success: `${created} angsuran dibuat dari tenor lama. Nominalnya bisa diubah satu per satu.`,
  };
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

  const { data: accountPayments } = await ctx.supabase
    .from("debt_payments")
    .select("amount, schedule_id")
    .eq("debt_account_id", account.id)
    .eq("owner_user_id", ctx.owner.userId)
    .is("reversed_at", null);

  const recordedPaid = (accountPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const tenorMonths = Number(account.installment_total_months ?? 0);
  const tenorAmount = Number(account.installment_amount ?? 0);
  let accountRemaining = 0;

  if (tenorMonths > 0 && tenorAmount > 0) {
    const paidMonths = Math.min(
      Math.max(Number(account.installment_month ?? 0), 0),
      tenorMonths,
    );
    const paid = Math.max(recordedPaid, tenorAmount * paidMonths);
    accountRemaining = Math.max(0, tenorAmount * tenorMonths - paid);
  } else if (Number(account.total_amount_due) > 0) {
    accountRemaining = Math.max(
      0,
      Number(account.total_amount_due) - recordedPaid,
    );
  }

  if (parsed.values.schedule_id) {
    const schedule = await findSchedule(
      ctx.owner.userId,
      parsed.values.schedule_id,
    );
    if (!schedule || schedule.debt_account_id !== account.id) {
      return { error: "Angsuran tidak sesuai dengan akun yang dipilih." };
    }
  }

  if (accountRemaining <= 0) {
    return { error: "Utang ini sudah lunas." };
  }
  if (parsed.values.amount > accountRemaining) {
    return {
      error: `Nominal melebihi sisa tagihan (${formatRupiah(accountRemaining)}).`,
    };
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

/**
 * Saves one amount per remaining month. Due dates keep the same day and follow
 * the account's next due month.
 */
export async function saveMonthlyAmountsAction(
  _prev: DebtActionResult,
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Utang tidak valid." };

  const account = await findAccount(ctx.owner.userId, id);
  if (!account) return { error: "Utang tidak ditemukan." };
  if (account.status === "closed") {
    return { error: "Utang ini sudah ditutup." };
  }

  const months = Number(account.installment_total_months ?? 0);
  const paidMonths = Math.min(
    Math.max(Number(account.installment_month ?? 0), 0),
    months,
  );
  const openMonths = months - paidMonths;
  if (openMonths <= 0) return { error: "Semua angsuran sudah lunas." };

  const rawAmounts = formData.getAll("amount").map((value) => String(value));
  if (rawAmounts.length !== openMonths) {
    return { error: `Isi nominal untuk ${openMonths} bulan tersisa.` };
  }

  const amounts: number[] = [];
  for (const raw of rawAmounts) {
    const amount = parseWholeRupiah(raw, { allowZero: false });
    if (amount === null) {
      return { error: "Setiap nominal bulan harus lebih dari nol." };
    }
    amounts.push(amount);
  }

  const { data: existingSchedules } = await ctx.supabase
    .from("debt_schedules")
    .select("id")
    .eq("debt_account_id", account.id)
    .eq("owner_user_id", ctx.owner.userId);

  const scheduleIds = (existingSchedules ?? []).map((row) => row.id);
  if (scheduleIds.length > 0) {
    const { count: linkedPayments } = await ctx.supabase
      .from("debt_payments")
      .select("id", { count: "exact", head: true })
      .eq("debt_account_id", account.id)
      .eq("owner_user_id", ctx.owner.userId)
      .in("schedule_id", scheduleIds);

    if ((linkedPayments ?? 0) > 0) {
      return {
        error:
          "Sudah ada pembayaran yang tercatat. Batalkan pembayarannya dulu sebelum mengubah nominal.",
      };
    }
  }

  const { error: clearError } = await ctx.supabase
    .from("debt_schedules")
    .delete()
    .eq("debt_account_id", account.id)
    .eq("owner_user_id", ctx.owner.userId);
  if (clearError) return { error: messageForError(clearError) };

  const start =
    account.due_date ?? dueDateForMonth(Number(account.due_day ?? 1), todayISO().slice(0, 7));
  const rows = amounts.map((amount, index) => ({
    owner_user_id: ctx.owner.userId,
    debt_account_id: account.id,
    due_date: addMonthsISO(start, index),
    amount_due: amount,
    notes: null,
    status: "upcoming" as DebtScheduleStatus,
  }));

  const { error: insertError } = await ctx.supabase
    .from("debt_schedules")
    .insert(rows);
  if (insertError) return { error: messageForError(insertError) };

  const paidValue = Number(account.installment_amount ?? 0) * paidMonths;
  const total = paidValue + amounts.reduce((sum, item) => sum + item, 0);
  await ctx.supabase
    .from("debt_accounts")
    .update({
      installment_amount: 0,
      total_amount_due: total,
      original_principal: total,
      interest_fees: 0,
    })
    .eq("id", account.id)
    .eq("owner_user_id", ctx.owner.userId);

  revalidateDebt();
  return {
    success: `Nominal ${amounts.length} bulan disimpan. Tanggal tetap tanggal ${account.due_day ?? start.slice(8, 10)}.`,
  };
}

export async function payDebtInstallmentAction(
  formData: FormData,
): Promise<DebtActionResult> {
  const ctx = await actionContext();
  if (!ctx) return { error: "Akses ditolak." };

  const id = text(formData, "id");
  if (!isUuid(id)) return { error: "Utang tidak valid." };

  const account = await accountForPayment(ctx.owner.userId, id);
  if (!account) {
    return { error: "Utang tidak ditemukan atau sudah ditutup." };
  }

  // A debt with per-month amounts pays its earliest remaining month.
  const { data: nextSchedules } = await ctx.supabase
    .from("debt_schedules")
    .select("*")
    .eq("debt_account_id", account.id)
    .eq("owner_user_id", ctx.owner.userId)
    .eq("status", "upcoming")
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1);

  const nextSchedule = nextSchedules?.[0];
  if (nextSchedule) {
    const key = `schedule:${nextSchedule.id}`;
    const { data: existingSchedulePayment } = await ctx.supabase
      .from("debt_payments")
      .select("id")
      .eq("owner_user_id", ctx.owner.userId)
      .eq("idempotency_key", key)
      .maybeSingle();
    if (existingSchedulePayment) {
      return { success: "Angsuran bulan ini sudah tercatat." };
    }

    const amount = Number(nextSchedule.amount_due);
    const { error: payError } = await ctx.supabase.from("debt_payments").insert({
      owner_user_id: ctx.owner.userId,
      debt_account_id: account.id,
      schedule_id: nextSchedule.id,
      amount,
      payment_date: todayISO(),
      payment_method: "installment",
      reference: `Angsuran ${nextSchedule.due_date}`,
      idempotency_key: key,
    });
    if (payError) return { error: messageForError(payError) };

    await ctx.supabase
      .from("debt_schedules")
      .update({ status: "paid" })
      .eq("id", nextSchedule.id)
      .eq("owner_user_id", ctx.owner.userId);

    const { data: following } = await ctx.supabase
      .from("debt_schedules")
      .select("due_date")
      .eq("debt_account_id", account.id)
      .eq("owner_user_id", ctx.owner.userId)
      .eq("status", "upcoming")
      .order("due_date", { ascending: true })
      .limit(1);

    const paidMonths = Number(account.installment_month ?? 0) + 1;
    const totalMonths = Number(account.installment_total_months ?? 0);
    await ctx.supabase
      .from("debt_accounts")
      .update({
        installment_month: Math.min(paidMonths, totalMonths),
        due_date:
          following?.[0]?.due_date ?? addMonthsISO(nextSchedule.due_date, 1),
        status: following && following.length > 0 ? "active" : "paid",
      })
      .eq("id", account.id)
      .eq("owner_user_id", ctx.owner.userId);

    revalidateDebt();
    return {
      success: `Angsuran ${formatRupiah(amount)} tercatat. Sisa tagihan berkurang.`,
    };
  }

  const months = Number(account.installment_total_months ?? 0);
  const monthly = Number(account.installment_amount ?? 0);
  if (months <= 0 || monthly <= 0) {
    return { error: "Isi nominal per bulan dan tenor terlebih dahulu." };
  }

  const paidMonths = Math.min(
    Math.max(Number(account.installment_month ?? 0), 0),
    months,
  );
  if (paidMonths >= months) return { error: "Semua angsuran sudah lunas." };

  const nextMonth = paidMonths + 1;
  const key = `installment:${account.id}:${nextMonth}`;
  const { data: existing } = await ctx.supabase
    .from("debt_payments")
    .select("id")
    .eq("owner_user_id", ctx.owner.userId)
    .eq("idempotency_key", key)
    .maybeSingle();
  if (existing) return { success: "Angsuran ini sudah tercatat." };

  const { data: recordedPayments } = await ctx.supabase
    .from("debt_payments")
    .select("amount")
    .eq("debt_account_id", account.id)
    .eq("owner_user_id", ctx.owner.userId)
    .is("reversed_at", null);

  const recordedPaid = (recordedPayments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const paidBefore = Math.max(recordedPaid, monthly * paidMonths);
  const remaining = Math.max(0, monthly * months - paidBefore);
  const amount = Math.min(monthly, remaining);
  if (amount <= 0) return { error: "Semua angsuran sudah lunas." };

  const { error } = await ctx.supabase.from("debt_payments").insert({
    owner_user_id: ctx.owner.userId,
    debt_account_id: account.id,
    schedule_id: null,
    amount,
    payment_date: todayISO(),
    payment_method: "installment",
    reference: `Angsuran ${nextMonth}/${months}`,
    idempotency_key: key,
  });

  if (error) return { error: messageForError(error) };

  const nextDueDate = addMonthsISO(
    account.due_date ?? nextDueDateForDay(account.due_day ?? 1),
    1,
  );
  const { data: updated, error: accountError } = await ctx.supabase
    .from("debt_accounts")
    .update({
      installment_month: nextMonth,
      due_date: nextDueDate,
      status: nextMonth >= months ? "paid" : "active",
    })
    .eq("id", account.id)
    .eq("owner_user_id", ctx.owner.userId)
    .select("id")
    .maybeSingle();

  if (accountError || !updated) {
    revalidateDebt();
    return {
      error:
        "Pembayaran tercatat, tetapi status utang gagal diperbarui. Muat ulang halaman.",
    };
  }

  revalidateDebt();
  return {
    success: `Angsuran ${formatRupiah(amount)} tercatat. Jatuh tempo maju ke bulan berikutnya.`,
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
