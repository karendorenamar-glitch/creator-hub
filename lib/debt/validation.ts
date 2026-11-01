import {
  enumValue,
  isRealDate,
  isUuid,
  optionalText,
  parseCount,
  parseWholeRupiah,
  text,
} from "@/lib/wedding/validation";
import { nextDueDateForDay } from "@/lib/debt/format";
import type {
  DebtAccountStatus,
  DebtAccountType,
  DebtScheduleStatus,
} from "@/lib/debt/db-types";

export const ACCOUNT_TYPES: readonly DebtAccountType[] = [
  "bank_loan",
  "credit_card",
  "personal_loan",
  "installment",
  "other",
];
export const ACCOUNT_STATUSES: readonly DebtAccountStatus[] = [
  "active",
  "paid",
  "closed",
];
export const SCHEDULE_STATUSES: readonly DebtScheduleStatus[] = [
  "upcoming",
  "paid",
  "cancelled",
];

export type ParsedAccount = {
  creditor_name: string;
  account_type: DebtAccountType;
  reference_label: string | null;
  original_principal: number;
  interest_fees: number;
  total_amount_due: number;
  opening_date: string;
  due_date: string | null;
  due_day: number | null;
  installment_month: number;
  installment_total_months: number;
  status: DebtAccountStatus;
  notes: string | null;
};

export function parseDebtAccount(
  formData: FormData,
): { ok: true; values: ParsedAccount } | { ok: false; error: string } {
  const creditorName = text(formData, "creditorName").slice(0, 120);
  if (!creditorName) return { ok: false, error: "Nama kreditur wajib diisi." };

  const accountType = enumValue(formData, "accountType", ACCOUNT_TYPES, "other");

  const total = parseWholeRupiah(text(formData, "totalAmountDue"), {
    allowZero: false,
  });
  if (total === null) {
    return { ok: false, error: "Nominal pinjaman harus lebih dari nol." };
  }

  // The form collects a single nominal field. Existing interest/fees are
  // preserved when editing, while the principal is adjusted to keep the DB
  // invariant total = principal + interest/fees.
  const interest = parseWholeRupiah(text(formData, "interestFees") || "0", {
    allowZero: true,
  });
  if (interest === null || interest > total) {
    return { ok: false, error: "Bunga/biaya tidak valid." };
  }
  const principal = total - interest;

  const openingDate = text(formData, "openingDate");
  if (!isRealDate(openingDate)) {
    return { ok: false, error: "Tanggal pembukaan tidak valid." };
  }

  const dueDayRaw = text(formData, "dueDay");
  const dueDay = dueDayRaw ? parseCount(dueDayRaw) : null;
  if (dueDayRaw && (dueDay === null || dueDay < 1 || dueDay > 31)) {
    return { ok: false, error: "Tanggal jatuh tempo harus 1–31." };
  }

  const submittedDueDate = text(formData, "dueDate") || null;
  if (submittedDueDate && !isRealDate(submittedDueDate)) {
    return { ok: false, error: "Tanggal jatuh tempo tidak valid." };
  }
  const dueDate = dueDay
    ? nextDueDateForDay(dueDay)
    : submittedDueDate;

  const totalMonthsRaw = text(formData, "installmentTotalMonths");
  const totalMonths = totalMonthsRaw ? parseCount(totalMonthsRaw) : 0;
  if (totalMonths === null || totalMonths < 0) {
    return { ok: false, error: "Total tenor tidak valid." };
  }

  const installmentMonthRaw = text(formData, "installmentMonth");
  const installmentMonth = installmentMonthRaw
    ? parseCount(installmentMonthRaw)
    : 0;
  if (installmentMonth === null || installmentMonth < 0) {
    return { ok: false, error: "Angsuran ke berapa tidak valid." };
  }
  if (totalMonths === 0 && installmentMonth !== 0) {
    return {
      ok: false,
      error: "Isi total tenor jika mengisi angsuran berjalan.",
    };
  }
  if (totalMonths > 0 && installmentMonth > totalMonths) {
    return {
      ok: false,
      error: "Angsuran berjalan tidak boleh melebihi total tenor.",
    };
  }

  const status = enumValue(formData, "status", ACCOUNT_STATUSES, "active");

  return {
    ok: true,
    values: {
      creditor_name: creditorName,
      account_type: accountType,
      reference_label: optionalText(formData, "referenceLabel", 120),
      original_principal: principal,
      interest_fees: interest,
      total_amount_due: total,
      opening_date: openingDate,
      due_date: dueDate,
      due_day: dueDay,
      installment_month: installmentMonth,
      installment_total_months: totalMonths,
      status,
      notes: optionalText(formData, "notes", 2000),
    },
  };
}

export function parseDebtPayment(formData: FormData):
  | {
      ok: true;
      values: {
        debt_account_id: string;
        schedule_id: string | null;
        amount: number;
        payment_date: string;
        payment_method: string | null;
        reference: string | null;
        notes: string | null;
        idempotency_key: string | null;
      };
    }
  | { ok: false; error: string } {
  const accountId = text(formData, "debtAccountId");
  if (!isUuid(accountId)) return { ok: false, error: "Pilih akun yang valid." };

  const scheduleId = text(formData, "scheduleId") || null;
  if (scheduleId && !isUuid(scheduleId)) {
    return { ok: false, error: "Jadwal tidak valid." };
  }

  const amount = parseWholeRupiah(text(formData, "amount"), {
    allowZero: false,
  });
  if (amount === null) {
    return { ok: false, error: "Nominal pembayaran harus lebih dari nol." };
  }

  const paymentDate = text(formData, "paymentDate");
  if (!isRealDate(paymentDate)) {
    return { ok: false, error: "Tanggal pembayaran tidak valid." };
  }

  const idempotencyKey = text(formData, "idempotencyKey") || null;
  if (idempotencyKey && !isUuid(idempotencyKey)) {
    return { ok: false, error: "Kunci idempotensi tidak valid." };
  }

  return {
    ok: true,
    values: {
      debt_account_id: accountId,
      schedule_id: scheduleId,
      amount,
      payment_date: paymentDate,
      payment_method: optionalText(formData, "paymentMethod", 80),
      reference: optionalText(formData, "reference", 200),
      notes: optionalText(formData, "notes", 2000),
      idempotency_key: idempotencyKey,
    },
  };
}

export function parseDebtSchedule(formData: FormData):
  | {
      ok: true;
      values: {
        debt_account_id: string;
        due_date: string;
        amount_due: number;
        notes: string | null;
      };
    }
  | { ok: false; error: string } {
  const accountId = text(formData, "debtAccountId");
  if (!isUuid(accountId)) return { ok: false, error: "Pilih akun yang valid." };

  const dueDate = text(formData, "dueDate");
  if (!isRealDate(dueDate)) {
    return { ok: false, error: "Tanggal jatuh tempo tidak valid." };
  }

  const amount = parseWholeRupiah(text(formData, "amountDue"), {
    allowZero: false,
  });
  if (amount === null) {
    return { ok: false, error: "Nominal jadwal harus lebih dari nol." };
  }

  return {
    ok: true,
    values: {
      debt_account_id: accountId,
      due_date: dueDate,
      amount_due: amount,
      notes: optionalText(formData, "notes", 2000),
    },
  };
}
