import { describe, expect, it } from "vitest";
import { demoData } from "@/lib/demo-data";
import { invoiceState, isOverdue } from "@/lib/documents";

const today = "2026-11-09";
const data = demoData(today, "2026-11-09T08:00:00.000Z");

describe("the demo business", () => {
  it("has quotes, invoices, expenses and stock, numbered like the real thing", () => {
    expect(data.documents.filter((d) => d.type === "quote").map((d) => d.number)).toEqual(["QUO-0001", "QUO-0002"]);
    expect(data.documents.filter((d) => d.type === "invoice").map((d) => d.number)).toEqual(["INV-0001", "INV-0002", "INV-0003"]);
    expect(data.counters).toEqual({ quote: 2, invoice: 3 });
    expect(data.expenses.length).toBeGreaterThan(0);
    expect(data.stock.length).toBeGreaterThan(0);
  });

  it("works out its dates from today, so an invoice is always overdue and one is part paid", () => {
    expect(data.documents.every((d) => d.issueDate <= today)).toBe(true);
    const invoices = data.documents.filter((d) => d.type === "invoice");
    expect(invoices.some((d) => isOverdue(d, today))).toBe(true);
    const states = invoices.map(invoiceState);
    expect(states.includes("part-paid")).toBe(true);
    expect(states.includes("paid")).toBe(true);
  });

  it("has unique ids and whole-cent money", () => {
    const ids = [...data.documents, ...data.expenses, ...data.stock].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of data.expenses) expect(Number.isInteger(e.amount)).toBe(true);
    for (const s of data.stock) expect(Number.isInteger(s.price)).toBe(true);
  });
});
