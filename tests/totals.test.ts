import { describe, expect, it } from "vitest";
import { lineTotal, totals } from "@/lib/totals";

const item = (quantity: number, unitPrice: number) => ({ id: "x", description: "", quantity, unitPrice });

describe("totals", () => {
  it("multiplies each line, including part quantities like 1.5 hours", () => {
    expect(lineTotal(item(1.5, 45000))).toBe(67500);
    expect(lineTotal(item(3, 333))).toBe(999);
  });

  it("adds 15% VAT after the discount", () => {
    const t = totals({ items: [item(2, 50000), item(1, 20000)], discountPercent: 10, vatEnabled: true });
    expect(t).toEqual({ subtotal: 120000, discount: 12000, net: 108000, vat: 16200, total: 124200 });
  });

  it("leaves VAT out for businesses that aren't VAT-registered", () => {
    const t = totals({ items: [item(1, 100000)], discountPercent: 0, vatEnabled: false });
    expect(t.vat).toBe(0);
    expect(t.total).toBe(100000);
  });

  it("rounds to the nearest cent, and keeps discounts between 0 and 100%", () => {
    expect(totals({ items: [item(1, 999)], discountPercent: 0, vatEnabled: true }).vat).toBe(150); // 149.85 → 150
    expect(totals({ items: [item(1, 1000)], discountPercent: 150, vatEnabled: false }).total).toBe(0);
    expect(totals({ items: [], discountPercent: 0, vatEnabled: true }).total).toBe(0);
  });
});
