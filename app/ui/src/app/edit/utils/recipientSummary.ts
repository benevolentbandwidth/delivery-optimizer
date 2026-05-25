import type { AddressCard } from "../types/delivery";

type RecipientContactFields = Partial<{
  recipientName: string;
  addresseeName: string;
  phoneNumber: string;
}>;

/** Display string for recipient name + phone (middle dot when both set). */
export function recipientSummary(a: RecipientContactFields): string {
  const n = (a.recipientName ?? a.addresseeName ?? "").trim();
  const p = (a.phoneNumber ?? "").trim();
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
