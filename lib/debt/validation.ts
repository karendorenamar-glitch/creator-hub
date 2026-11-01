import {
  enumValue,
  isRealDate,
  isUuid,
  optionalText,
  parseCount,
  parseWholeRupiah,
  text,
} from "@/lib/wedding/validation";
import { dueDateForMonth } from "@/lib/debt/format";
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
  installment_amount: number;
  status: DebtAccountStatus;
  notes: string | null;
};

/**
 * Every account is driven by its installment schedule. The original debt is
 * optional: leaving it empty keeps the schedule as the source of truth.
 */
export function parseDebtAccount(
  formData: FormData,
): { ok: true; values: ParsedAccount } | { ok: false; error: string } {
  const creditorName = text(formData, "creditorName").slice(0, 120);
  if (!creditorName) return { ok: false, error: "Nama utang atau kreditur wajib diisi." };

  const accountType = enumValue(formData, "accountType", ACCOUNT_TYPES, "other");

  const originalRaw = text(formData, "originalDebt");
  let total = 0;
  if (originalRaw) {
    const parsedTotal = parseWholeRupiah(originalRaw, { allowZero: false });
    if (parsedTotal === null) {
      return { ok: false, error: "Utang awal harus lebih dari nol." };
    }
    total = parsedTotal;
  }

  const openingDate = text(formData, "openingDate");
  if (!isRealDate(openingDate)) {
    return { ok: false, error: "Tanggal mulai tidak valid." };
  }

  const finalDueRaw = text(formData, "finalDueDate");
  if (finalDueRaw && !isRealDate(finalDueRaw)) {
    return { ok: false, error: "Tanggal akhir tidak valid." };
  }
  if (finalDueRaw && finalDueRaw < openingDate) {
    return {
      ok: false,
      error: "Tanggal akhir tidak boleh sebelum tanggal mulai.",
    };
  }

  const status = enumValue(formData, "status", ACCOUNT_STATUSES, "active");

  return {
    ok: true,
    values: {
      creditor_name: creditorName,
      account_type: accountType,
      reference_label: optionalText(formData, "referenceLabel", 120),
      original_principal: total,
      interest_fees: 0,
      total_amount_due: total,
      opening_date: openingDate,
      due_date: finalDueRaw || null,
      due_day: null,
      installment_month: 0,
      installment_total_months: 0,
      installment_amount: 0,
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
    return { ok: false, error: "Angsuran tidak valid." };
  }

  const amount = parseWholeRupiah(text(formData, "amount"), { allowZero: false });
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
    return { ok: false, error: "Nominal angsuran harus lebih dari nol." };
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

export type ParsedScheduleBatch = {
  debt_account_id: string;
  start_month: string;
  due_day: number;
  count: number;
  amount_due: number;
  notes: string | null;
};

export function parseDebtScheduleBatch(
  formData: FormData,
): { ok: true; values: ParsedScheduleBatch } | { ok: false; error: string } {
  const accountId = text(formData, "debtAccountId");
  if (!isUuid(accountId)) return { ok: false, error: "Pilih akun yang valid." };

  const startMonth = text(formData, "startMonth");
  if (!startMonth || !isRealDate(`${startMonth}-01`)) {
    return { ok: false, error: "Bulan mulai tidak valid." };
  }

  const dueDay = parseCount(text(formData, "dueDay"));
  if (dueDay === null || dueDay < 1 || dueDay > 31) {
    return { ok: false, error: "Tanggal jatuh tempo harus 1-31." };
  }

  const count = parseCount(text(formData, "count"));
  if (count === null || count < 1 || count > 60) {
    return { ok: false, error: "Jumlah angsuran harus 1-60." };
  }

  const amount = parseWholeRupiah(text(formData, "amountDue"), {
    allowZero: false,
  });
  if (amount === null) {
    return { ok: false, error: "Nominal angsuran harus lebih dari nol." };
  }

  return {
    ok: true,
    values: {
      debt_account_id: accountId,
      start_month: startMonth,
      due_day: dueDay,
      count,
      amount_due: amount,
      notes: optionalText(formData, "notes", 2000),
    },
  };
}

export function parseDebtScheduleUpdate(
  formData: FormData,
):
  | {
      ok: true;
      values: {
        id: string;
        due_date: string;
        amount_due: number;
        notes: string | null;
      };
    }
  | { ok: false; error: string } {
  const id = text(formData, "id");
  if (!isUuid(id)) return { ok: false, error: "Angsuran tidak valid." };

  const dueDate = text(formData, "dueDate");
  if (!isRealDate(dueDate)) {
    return { ok: false, error: "Tanggal jatuh tempo tidak valid." };
  }

  const amount = parseWholeRupiah(text(formData, "amountDue"), {
    allowZero: false,
  });
  if (amount === null) {
    return { ok: false, error: "Nominal angsuran harus lebih dari nol." };
  }

  return {
    ok: true,
    values: {
      id,
      due_date: dueDate,
      amount_due: amount,
      notes: optionalText(formData, "notes", 2000),
    },
  };
}

export { dueDateForMonth };
