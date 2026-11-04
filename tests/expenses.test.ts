import { describe, expect, it } from "vitest";
import { claimableVat, createExpense, deleteExpense, expensesCsv, expensesIn, periods, summarise, updateExpense, vatInside } from "@/lib/expenses";
import { addPayment, createDocument, updateDocument } from "@/lib/documents";
import { emptyData, readData, readExpense } from "@/lib/storage";
import { changesBetween, hasChanges } from "@/lib/diff";
import { fitWithin } from "@/lib/receipt-image";
import type { AppData, Expense } from "@/lib/types";

const today = "2026-11-04";
const base = { supplier: "Builders Warehouse", description: "Pipes", category: "materials" as const, hasReceipt: false };

/** A VAT-registered business with one R1 000 (+ R150 VAT) invoice in November, paid R500 */
function business(vatNumber = "4123456789"): AppData {
  let data: AppData = { ...emptyData(), business: { ...emptyData().business, vatNumber } };
  const made = createDocument(data, "invoice", today);
  data = updateDocument(made.data, made.doc.id, {
    issueDate: "2026-11-02",
    vatEnabled: vatNumber !== "",
    items: [{ id: "1", description: "Geyser repair", quantity: 1, unitPrice: 100000 }],
  });
  return addPayment(data, made.doc.id, { date: "2026-11-03", amount: 50000, method: "eft" });
}

describe("expense VAT", () => {
  it("finds the 15% VAT inside an amount that includes it", () => {
    expect(vatInside(11500)).toBe(1500); // R115 includes R15
    expect(vatInside(10000)).toBe(1304); // R100 includes R13,04 (rounded to the cent)
  });

  it("only counts VAT the business can claim back", () => {
    expect(claimableVat({ amount: 11500, vatClaimable: true })).toBe(1500);
    expect(claimableVat({ amount: 11500, vatClaimable: false })).toBe(0);
  });
});

describe("adding, changing and removing expenses", () => {
  it("adds, edits and deletes one expense, and saves only that", () => {
    const before = business();
    const { data, expense } = createExpense(before, { ...base, date: "2026-11-03", amount: 23000, vatClaimable: true });
    let c = changesBetween(before, data);
    expect(c.expenseUpserts.map((e) => e.id)).toEqual([expense.id]);
    expect(c.upserts).toEqual([]); // no quote or invoice changed
    const edited = updateExpense(data, expense.id, { amount: 25000 });
    expect(edited.expenses[0].amount).toBe(25000);
    expect(changesBetween(data, edited).expenseUpserts).toHaveLength(1);
    c = changesBetween(edited, deleteExpense(edited, expense.id));
    expect(c.expenseDeletes).toEqual([expense.id]);
    expect(hasChanges(changesBetween(edited, edited))).toBe(false);
  });
});

describe("periods", () => {
  it("knows this month, last month, the 2-month VAT period and the tax year", () => {
    const p = periods("2026-11-04");
    expect([p.thisMonth.from, p.thisMonth.to]).toEqual(["2026-11-01", "2026-11-30"]);
    expect([p.lastMonth.from, p.lastMonth.to]).toEqual(["2026-10-01", "2026-10-31"]);
    expect([p.vatPeriod.from, p.vatPeriod.to]).toEqual(["2026-11-01", "2026-12-31"]);
    expect([p.taxYear.from, p.taxYear.to]).toEqual(["2026-03-01", "2027-02-28"]);
  });

  it("handles January, even months and leap years", () => {
    const jan = periods("2027-01-15");
    expect([jan.lastMonth.from, jan.lastMonth.to]).toEqual(["2026-12-01", "2026-12-31"]);
    expect([jan.vatPeriod.from, jan.vatPeriod.to]).toEqual(["2027-01-01", "2027-02-28"]);
    expect([jan.taxYear.from, jan.taxYear.to]).toEqual(["2026-03-01", "2027-02-28"]);
    expect(periods("2028-02-10").vatPeriod.to).toBe("2028-02-29"); // 2028 is a leap year
    expect(periods("2026-04-30").vatPeriod.from).toBe("2026-03-01"); // April is the second month of Mar–Apr
  });
});

describe("the money summary", () => {
  it("works out profit and VAT owed for a VAT-registered business", () => {
    let data = business();
    data = createExpense(data, { ...base, date: "2026-11-03", amount: 23000, vatClaimable: true }).data; // R200 + R30 VAT
    data = createExpense(data, { ...base, date: "2026-11-04", amount: 5000, vatClaimable: false, category: "bank" }).data; // R50, no VAT
    data = createExpense(data, { ...base, date: "2026-10-31", amount: 99900, vatClaimable: true }).data; // last month: not counted
    const s = summarise(data, periods(today).thisMonth);
    expect(s.invoices).toBe(1);
    expect(s.sales).toBe(100000);
    expect(s.outputVat).toBe(15000);
    expect(s.received).toBe(50000);
    expect(s.expensesTotal).toBe(28000);
    expect(s.inputVat).toBe(3000);
    expect(s.expensesNet).toBe(25000);
    expect(s.profit).toBe(75000); // R1 000 sales − R250 expenses
    expect(s.vatOwed).toBe(12000); // R150 − R30
    expect(s.byCategory).toEqual([
      { category: "materials", total: 23000 },
      { category: "bank", total: 5000 },
    ]);
  });

  it("says SARS owes you when more VAT was paid than charged", () => {
    const data = createExpense(business(), { ...base, date: "2026-11-03", amount: 230000, vatClaimable: true }).data;
    expect(summarise(data, periods(today).thisMonth).vatOwed).toBe(15000 - 30000);
  });

  it("counts expenses in full, with no VAT, for a business that isn't registered", () => {
    const data = createExpense(business(""), { ...base, date: "2026-11-03", amount: 23000, vatClaimable: true }).data;
    const s = summarise(data, periods(today).thisMonth);
    expect(s.vatRegistered).toBe(false);
    expect(s.inputVat).toBe(0);
    expect(s.expensesNet).toBe(23000);
    expect(s.profit).toBe(100000 - 23000);
  });

  it("doesn't count quotes as sales", () => {
    const made = createDocument(business(), "quote", today);
    const data = updateDocument(made.data, made.doc.id, { issueDate: today, items: [{ id: "q", description: "x", quantity: 1, unitPrice: 999900 }] });
    expect(summarise(data, periods(today).thisMonth).sales).toBe(100000);
  });
});

describe("reading saved expenses", () => {
  it("keeps good expenses and fixes or drops broken ones", () => {
    const good = { id: "e1", date: "2026-11-03", supplier: "Spar", description: "", category: "fuel", amount: 1234.4, vatClaimable: true, hasReceipt: true };
    expect(readExpense(good)).toMatchObject({ id: "e1", amount: 1234, category: "fuel", vatClaimable: true, hasReceipt: true });
    expect(readExpense({ ...good, category: "holiday" })?.category).toBe("other");
    expect(readExpense({ ...good, date: "3 Nov" })).toBeNull();
    expect(readExpense({ ...good, amount: -5 })).toBeNull();
  });

  it("opens backups from before expenses existed", () => {
    expect(readData({ documents: [] }).expenses).toEqual([]);
  });
});

describe("the expenses CSV", () => {
  it("has a header row and one row per expense, in rands", () => {
    const e: Expense = { ...base, id: "1", date: "2026-11-03", amount: 23000, vatClaimable: true, hasReceipt: true, createdAt: "", updatedAt: "" };
    const csv = expensesCsv([e], ["Date", "Supplier", "What for", "Category", "Amount", "VAT", "Receipt"], () => "Materials", "Yes", "No");
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe("Date,Supplier,What for,Category,Amount,VAT,Receipt");
    expect(lines[1]).toBe("2026-11-03,Builders Warehouse,Pipes,Materials,230.00,30.00,Yes");
  });

  it("lists the period's expenses newest first", () => {
    let data = business();
    data = createExpense(data, { ...base, date: "2026-11-01", amount: 100, vatClaimable: false }).data;
    data = createExpense(data, { ...base, date: "2026-11-04", amount: 200, vatClaimable: false }).data;
    expect(expensesIn(data, periods(today).thisMonth).map((e) => e.date)).toEqual(["2026-11-04", "2026-11-01"]);
  });
});

describe("receipt photos", () => {
  it("are made at most 1400 pixels on their longest side, and never bigger", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1400, height: 1050 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1050, height: 1400 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
