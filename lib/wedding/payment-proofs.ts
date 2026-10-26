/**
 * Pure grouping used by the Vendors UI so every proof file stays attached to
 * its own payment transaction.
 */
export function groupProofsByPayment<T extends { payment_id: string }>(
  proofs: T[],
): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const proof of proofs) {
    (map[proof.payment_id] ??= []).push(proof);
  }
  return map;
}
