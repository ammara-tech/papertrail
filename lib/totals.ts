import type { Doc, LineItem } from "@/lib/types";

/*
  Adding up a quote or invoice. All in cents, rounded once per step, in the order
  South African businesses do it: lines → subtotal → discount → VAT on what's left.
  Tested in tests/totals.test.ts.
*/

export const VAT_RATE = 0.15; // South African VAT

export function lineTotal(item: Pick<LineItem, "quantity" | "unitPrice">): number {
  return Math.round(item.quantity * item.unitPrice);
}

export type Totals = { subtotal: number; discount: number; net: number; vat: number; total: number };

export function totals(doc: Pick<Doc, "items" | "discountPercent" | "vatEnabled">): Totals {
  const subtotal = doc.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const pct = Math.min(100, Math.max(0, doc.discountPercent || 0));
  const discount = Math.round((subtotal * pct) / 100);
  const net = subtotal - discount;
  const vat = doc.vatEnabled ? Math.round(net * VAT_RATE) : 0;
  return { subtotal, discount, net, vat, total: net + vat };
}
