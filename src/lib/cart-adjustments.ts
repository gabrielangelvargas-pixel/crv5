export type CartAdjustment = { description: string; amountCents: number };
export function parseAdjustmentAmount(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && Math.abs(cents) <= 100000000000 ? cents : null;
}
export function cartPayableCents(subtotal: number, adjustments: CartAdjustment[]) {
  return Math.round(subtotal * 100) + adjustments.reduce((sum, item) => sum + item.amountCents, 0);
}
