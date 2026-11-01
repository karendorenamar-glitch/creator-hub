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
export type AccountPlan = {
  mode: "same" | "custom";
  monthly_amount: number;
  tenor_months: number;
  paid_months: number;
  due_day: number | null;
  first_due_month: string | null;
  /** Concrete rows that still have to be paid: month (YYYY-MM) + amount. */
  installments: { month: string; amount: number }[];
};

export function parseDebtAccount(
  formData: FormData,
):
  | { ok: true; values: ParsedAccount; plan: AccountPlan }
  | { ok: false; error: string } {
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

  const tenorTotalRaw = text(formData, "tenorTotal");
  const tenorMonths = tenorTotalRaw ? parseCount(tenorTotalRaw) : 0;
  if (tenorMonths === null || tenorMonths < 0 || tenorMonths > 600) {
    return { ok: false, error: "Jumlah tenor tidak valid." };
  }

  const tenorPaidRaw = text(formData, "tenorPaid");
  const paidMonths = tenorPaidRaw ? parseCount(tenorPaidRaw) : 0;
  if (paidMonths === null || paidMonths < 0 || paidMonths > 600) {
    return { ok: false, error: "Angsuran yang sudah dibayar tidak valid." };
  }
  if (tenorMonths > 0 && paidMonths > tenorMonths) {
    return {
      ok: false,
      error: "Angsuran yang sudah dibayar tidak boleh melebihi total tenor.",
    };
  }

  const mode = text(formData, "amountMode") === "custom" ? "custom" : "same";

  const monthlyRaw = text(formData, "monthlyAmount");
  let monthlyAmount = 0;
  if (monthlyRaw) {
    const parsedMonthly = parseWholeRupiah(monthlyRaw, { allowZero: false });
    if (parsedMonthly === null) {
      return { ok: false, error: "Nominal per bulan harus lebih dari nol." };
    }
    monthlyAmount = parsedMonthly;
  }

  const dueDayRaw = text(formData, "dueDay");
  const parsedDueDay = dueDayRaw ? parseCount(dueDayRaw) : null;
  if (dueDayRaw && (parsedDueDay === null || parsedDueDay < 1 || parsedDueDay > 31)) {
    return { ok: false, error: "Tanggal jatuh tempo harus 1-31." };
  }

  const firstDueMonthRaw = text(formData, "firstDueMonth");
  if (firstDueMonthRaw && !isRealDate(`${firstDueMonthRaw}-01`)) {
    return { ok: false, error: "Bulan jatuh tempo pertama tidak valid." };
  }
  if (firstDueMonthRaw && !parsedDueDay) {
    return { ok: false, error: "Pilih tanggal jatuh tempo." };
  }

  const openMonths = Math.max(0, tenorMonths - paidMonths);
  const firstMonth = firstDueMonthRaw || "";
  const installments: { month: string; amount: number }[] = [];

  if (mode === "same") {
    if (tenorMonths > 0 && monthlyAmount <= 0) {
      return { ok: false, error: "Nominal per bulan wajib diisi." };
    }
    if (tenorMonths > 0 && !firstMonth) {
      return { ok: false, error: "Pilih bulan jatuh tempo pertama." };
    }
    for (let index = 0; index < openMonths; index += 1) {
      installments.push({
        month: addMonthsToMonth(firstMonth, index),
        amount: monthlyAmount,
      });
    }
  } else {
    const months = formData.getAll("customMonth").map((value) => String(value));
    const amounts = formData
      .getAll("customAmount")
      .map((value) => String(value));

    if (months.length === 0) {
      return { ok: false, error: "Isi nominal untuk minimal satu angsuran.",
      };
    }
    if (months.length !== amounts.length) {
      return { ok: false, error: "Data angsuran tidak lengkap." };
    }
    if (openMonths > 0 && months.length !== openMonths) {
      return {
        ok: false,
        error: `Jumlah angsuran harus ${openMonths} baris sesuai sisa tenor.`,
      };
    }

    for (let index = 0; index < months.length; index += 1) {
      if (!isRealDate(`${months[index]}-01`)) {
        return { ok: false, error: "Bulan angsuran tidak valid." };
      }
      const amount = parseWholeRupiah(amounts[index], { allowZero: false });
      if (amount === null) {
        return { ok: false, error: "Nominal angsuran harus lebih dari nol." };
      }
      installments.push({ month: months[index], amount });
    }
  }

  if (mode === "same" && tenorMonths > 0 && monthlyAmount > 0) {
    total = monthlyAmount * tenorMonths;
  } else if (mode === "custom" && !total) {
    // The paid months are unknown in custom mode, so only the remaining rows
    // are tracked. The tenor badge still shows how many months were paid.
    total = installments.reduce((sum, item) => sum + item.amount, 0);
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
      due_date:
        parsedDueDay && firstDueMonthRaw
          ? dueDateForMonth(parsedDueDay, firstDueMonthRaw)
          : finalDueRaw || null,
      due_day: parsedDueDay,
      installment_month: paidMonths,
      installment_total_months: tenorMonths,
      installment_amount: mode === "same" ? monthlyAmount : 0,
      status,
      notes: optionalText(formData, "notes", 2000),
    },
    plan: {
      mode,
      monthly_amount: mode === "same" ? monthlyAmount : 0,
      tenor_months: tenorMonths,
      paid_months: paidMonths,
      due_day: parsedDueDay,
      first_due_month: firstDueMonthRaw || null,
      installments,
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

function addMonthsToMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
}
