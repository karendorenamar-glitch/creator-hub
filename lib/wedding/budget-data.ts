import type {
  VendorPayment,
  VendorPaymentProof,
  WeddingDonation,
} from "@/lib/wedding/db-types";
import {
  calculateBudget,
  type BudgetOtherCost,
  type BudgetPayment,
  type BudgetResult,
  type BudgetVendor,
} from "@/lib/wedding/budget-calc";
import { createWeddingClient } from "@/lib/wedding/supabase";
import { PAYMENT_PROOF_BUCKET } from "@/lib/wedding/uploads";

export type BudgetData = {
  vendors: BudgetVendor[];
  payments: BudgetPayment[];
  otherCosts: BudgetOtherCost[];
  donations: WeddingDonation[];
  donationSchemaReady: boolean;
  calc: BudgetResult;
};

export type VendorsPageData = {
  vendors: BudgetVendor[];
  payments: VendorPayment[];
  proofs: VendorPaymentProof[];
  proofUrls: Record<string, string>;
  otherCosts: BudgetOtherCost[];
  donations: WeddingDonation[];
  donationSchemaReady: boolean;
  calc: BudgetResult;
};

function numeric(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapOtherCosts(
  rows:
    | {
        id: string;
        name: string;
        amount: number | string | null;
        payment_status: string;
        amount_paid: number | string | null;
      }[]
    | null
    | undefined,
): BudgetOtherCost[] {
  return (rows ?? []).map((row) => {
    const amount = numeric(row.amount) ?? 0;
    const paidAmount = Math.min(
      Math.max(numeric(row.amount_paid) ?? 0, 0),
      Math.max(amount, 0),
    );
    return {
      id: row.id,
      name: row.name,
      amount,
      paidAmount,
    };
  });
}

export async function loadBudgetData(
  weddingId: string,
  targetBudget: number,
): Promise<BudgetData> {
  const supabase = await createWeddingClient();

  const [vendorsResult, paymentsResult, otherCostsResult, donationsResult] =
    await Promise.all([
      supabase
        .from("vendors")
        .select(
          "id, name, category, contact_name, phone, notes, agreed_price, archived_at, selection_status, collaboration_completed_at",
        )
        .eq("wedding_id", weddingId),
      supabase
        .from("vendor_payments")
        .select("id, vendor_id, amount, payment_kind")
        .eq("wedding_id", weddingId),
      supabase
        .from("expenses")
        .select("id, name, amount, amount_paid, payment_status")
        .eq("wedding_id", weddingId)
        .is("vendor_id", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("wedding_donations")
        .select("id, wedding_id, donor_name, amount, created_at, updated_at")
        .eq("wedding_id", weddingId)
        .order("created_at", { ascending: true }),
    ]);

  if (vendorsResult.error) throw new Error(vendorsResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  // Other costs live in the existing expenses table with vendor_id = NULL.
  const otherCosts = otherCostsResult.error
    ? []
    : mapOtherCosts(otherCostsResult.data);
  const donations: WeddingDonation[] = donationsResult.error
    ? []
    : (donationsResult.data ?? []).map((donation) => ({
        ...donation,
        amount: Number(donation.amount),
      }));
  const donationSchemaReady = !donationsResult.error;

  const vendors: BudgetVendor[] = (vendorsResult.data ?? []).map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    contact_name: vendor.contact_name,
    phone: vendor.phone,
    notes: vendor.notes,
    agreed_price: numeric(vendor.agreed_price),
    archived_at: vendor.archived_at,
    selection_status: vendor.selection_status,
    collaboration_completed_at: vendor.collaboration_completed_at,
  }));

  const payments: BudgetPayment[] = (paymentsResult.data ?? []).map(
    (payment) => ({
      id: payment.id,
      vendor_id: payment.vendor_id,
      amount: Number(payment.amount),
      payment_kind: payment.payment_kind,
    }),
  );

  return {
    vendors,
    payments,
    otherCosts,
    donations,
    donationSchemaReady,
    calc: calculateBudget({
      vendors,
      payments,
      otherCosts,
      donations,
      targetBudget,
    }),
  };
}

export async function loadVendorsPageData(
  weddingId: string,
  targetBudget: number,
): Promise<VendorsPageData> {
  const supabase = await createWeddingClient();

  const [
    vendorsResult,
    paymentsResult,
    proofsResult,
    otherCostsResult,
    donationsResult,
  ] = await Promise.all([
      supabase
        .from("vendors")
        .select(
          "id, name, category, contact_name, phone, notes, agreed_price, archived_at, selection_status, collaboration_completed_at",
        )
        .eq("wedding_id", weddingId)
        .order("created_at", { ascending: true }),
      supabase
        .from("vendor_payments")
        .select(
          "id, wedding_id, vendor_id, amount, paid_on, method, notes, payment_kind, proof_path, created_at",
        )
        .eq("wedding_id", weddingId)
        .order("paid_on", { ascending: true }),
      supabase
        .from("vendor_payment_proofs")
        .select(
          "id, wedding_id, payment_id, path, mime_type, original_name, sort_order, created_at",
        )
        .eq("wedding_id", weddingId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("expenses")
        .select("id, name, amount, amount_paid, payment_status")
        .eq("wedding_id", weddingId)
        .is("vendor_id", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("wedding_donations")
        .select("id, wedding_id, donor_name, amount, created_at, updated_at")
        .eq("wedding_id", weddingId)
        .order("created_at", { ascending: true }),
    ]);

  if (vendorsResult.error) throw new Error(vendorsResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  // The proof table is additive (migration 020). Until it is applied, the page
  // must still render legacy proof_path data.
  const proofs: VendorPaymentProof[] = proofsResult.error
    ? []
    : (proofsResult.data ?? []);
  const otherCosts = otherCostsResult.error
    ? []
    : mapOtherCosts(otherCostsResult.data);
  const donations: WeddingDonation[] = donationsResult.error
    ? []
    : (donationsResult.data ?? []).map((donation) => ({
        ...donation,
        amount: Number(donation.amount),
      }));
  const donationSchemaReady = !donationsResult.error;

  const vendors: BudgetVendor[] = (vendorsResult.data ?? []).map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    contact_name: vendor.contact_name,
    phone: vendor.phone,
    notes: vendor.notes,
    agreed_price: numeric(vendor.agreed_price),
    archived_at: vendor.archived_at,
    selection_status: vendor.selection_status,
    collaboration_completed_at: vendor.collaboration_completed_at,
  }));

  const payments: VendorPayment[] = (paymentsResult.data ?? []).map(
    (payment) => ({
      ...payment,
      amount: Number(payment.amount),
      idempotency_key: null,
    }),
  );

  const budgetPayments: BudgetPayment[] = payments.map((payment) => ({
    id: payment.id,
    vendor_id: payment.vendor_id,
    amount: payment.amount,
    payment_kind: payment.payment_kind,
  }));

  const proofPaths = Array.from(
    new Set([
      ...proofs.map((proof) => proof.path),
      ...payments
        .map((payment) => payment.proof_path)
        .filter((path): path is string => Boolean(path)),
    ]),
  );

  const proofUrls: Record<string, string> = {};
  if (proofPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(PAYMENT_PROOF_BUCKET)
      .createSignedUrls(proofPaths, 60 * 60);
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) {
        proofUrls[entry.path] = entry.signedUrl;
      }
    }
  }

  return {
    vendors,
    payments,
    proofs,
    proofUrls,
    otherCosts,
    donations,
    donationSchemaReady,
    calc: calculateBudget({
      vendors,
      payments: budgetPayments,
      otherCosts,
      donations,
      targetBudget,
    }),
  };
}
