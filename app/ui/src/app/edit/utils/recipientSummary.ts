import type { AddressCard } from "../types/delivery";

/**
 * Display string for recipient name + phone (middle dot when both set).
 * Callers guarded by hasRecipientContact() skip the "—" fallback; it remains for direct use and tests.
 */
export function recipientSummary(
  a: Pick<AddressCard, "recipientName" | "phoneNumber">,
): string {
  const n = a.recipientName.trim();
  const p = a.phoneNumber.trim();
  if (n && p) return `${n} · ${p}`;
  if (n) return n;
  if (p) return p;
  return "—";
}

export function hasRecipientContact(
  a: Pick<AddressCard, "recipientName" | "phoneNumber">,
): boolean {
  return Boolean(a.recipientName.trim() || a.phoneNumber.trim());
}
