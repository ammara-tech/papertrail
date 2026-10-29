import { describe, expect, it } from "vitest";
import {
  addPayment, balance, collectedByMonth, convertToInvoice, createDocument, duplicateDocument, formatNumber,
  invoiceState, isOverdue, markPaid, removePayment, stampFor, summary, updateDocument,
} from "@/lib/documents";
import { addDays, daysBetween, formatDate } from "@/lib/dates";
import { emptyData } from "@/lib/storage";
import type { AppData } from "@/lib/types";

const today = "2026-10-29";
const line = (unitPrice: number) => [{ id: "a", description: "Work", quantity: 1, unitPrice }];

/** A no-VAT invoice for a round amount, to keep the sums easy to read */
function invoiceFor(cents: number, issued = today, data: AppData = emptyData()) {
  data.business.vatByDefault = false;
  const made = createDocument(data, "invoice", issued);
  return { data: updateDocument(made.data, made.doc.id, { items: line(cents) }), id: made.doc.id };
}

describe("numbering", () => {
  it("numbers quotes and invoices separately, with four digits", () => {
    expect(formatNumber("quote", 7)).toBe("QUO-0007");
    let data = emptyData();
    data = createDocument(data, "quote", today).data;
    data = createDocument(data, "invoice", today).data;
    expect(createDocument(data, "quote", today).doc.number).toBe("QUO-0002");
    expect(data.counters).toEqual({ quote: 1, invoice: 1 });
  });

  it("never lets an update change a document's number or type", () => {
    const made = createDocument(emptyData(), "quote", today);
    const data = updateDocument(made.data, made.doc.id, { number: "HACK", type: "invoice" });
    expect(data.documents[0].number).toBe("QUO-0001");
    expect(data.documents[0].type).toBe("quote");
  });
});

describe("dates", () => {
  it("adds days across month ends, counts days, and writes dates the same everywhere", () => {
    expect(addDays("2026-10-29", 30)).toBe("2026-11-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-10-29", "2026-11-01")).toBe(3);
    expect(formatDate("2026-09-01")).toBe("1 Sep 2026");
    expect(formatDate("2026-10-29", "af")).toBe("29 Okt 2026");
  });
});

describe("quotes", () => {
  it("turns an accepted quote into an invoice with the same client and lines", () => {
    const made = createDocument(emptyData(), "quote", today);
    const data = updateDocument(made.data, made.doc.id, {
      client: { name: "Thabo's Plumbing", email: "", phone: "", address: "" },
      items: [{ id: "a", description: "Geyser repair", quantity: 1, unitPrice: 185000 }],
    });
    const result = convertToInvoice(data, made.doc.id, today)!;
    expect(result.doc.number).toBe("INV-0001");
    expect(result.doc.fromQuote).toBe("QUO-0001");
    expect(result.doc.client.name).toBe("Thabo's Plumbing");
    expect(result.doc.items[0].description).toBe("Geyser repair");
    expect(result.data.documents.find((d) => d.id === made.doc.id)!.quoteStatus).toBe("accepted");
  });

  it("duplicates with a new number and today's date, keeping the lines", () => {
    const { data, id } = invoiceFor(50000, "2026-09-01");
    const copy = duplicateDocument(data, id, today)!;
    expect(copy.doc.number).toBe("INV-0002");
    expect(copy.doc.issueDate).toBe(today);
    expect(copy.doc.items[0].unitPrice).toBe(50000);
    expect(copy.doc.payments).toEqual([]);
  });
});

describe("payments", () => {
  it("a deposit makes an invoice part-paid, and the rest makes it paid", () => {
    let { data, id } = invoiceFor(100000);
    data = addPayment(data, id, { date: today, amount: 30000, method: "eft" });
    let doc = data.documents[0];
    expect(invoiceState(doc)).toBe("part-paid");
    expect(balance(doc)).toBe(70000);
    data = markPaid(data, id, today);
    doc = data.documents[0];
    expect(invoiceState(doc)).toBe("paid");
    expect(balance(doc)).toBe(0);
    expect(doc.payments.map((p) => p.amount)).toEqual([30000, 70000]);
  });

  it("ignores payments of zero or less, and removing a payment brings the balance back", () => {
    const start = invoiceFor(100000);
    let data = start.data;
    const id = start.id;
    expect(addPayment(data, id, { date: today, amount: 0, method: "cash" })).toBe(data);
    data = addPayment(data, id, { date: today, amount: 100000, method: "cash" });
    data = removePayment(data, id, data.documents[0].payments[0].id);
    expect(balance(data.documents[0])).toBe(100000);
  });

  it("is overdue the day after it's due while money is owed, and never once paid", () => {
    let { data, id } = invoiceFor(100000, "2026-09-01");
    data = updateDocument(data, id, { dueDate: "2026-10-28" });
    expect(isOverdue(data.documents[0], "2026-10-28")).toBe(false);
    expect(stampFor(data.documents[0], today)).toBe("overdue");
    data = addPayment(data, id, { date: today, amount: 40000, method: "eft" });
    expect(stampFor(data.documents[0], today)).toBe("overdue"); // still owes money: overdue is what needs action
    data = markPaid(data, id, today);
    expect(stampFor(data.documents[0], today)).toBe("paid");
  });
});

describe("overview numbers", () => {
  it("adds up what's owed, overdue and collected", () => {
    const a = invoiceFor(100000, "2026-09-01");
    let data = updateDocument(a.data, a.id, { dueDate: "2026-10-01" });
    const b = invoiceFor(50000, today, data);
    data = addPayment(b.data, b.id, { date: today, amount: 20000, method: "eft" });
    const s = summary(data.documents, today);
    expect(s.owed).toBe(130000);
    expect(s.unpaidCount).toBe(2);
    expect(s.overdueCount).toBe(1);
    expect(s.overdueAmount).toBe(100000);
    expect(s.collected).toBe(20000);
  });

  it("groups money received by month, oldest first, with empty months as zero", () => {
    let { data, id } = invoiceFor(300000, "2026-08-01");
    data = addPayment(data, id, { date: "2026-08-15", amount: 100000, method: "eft" });
    data = addPayment(data, id, { date: "2026-10-02", amount: 50000, method: "cash" });
    data = addPayment(data, id, { date: "2026-03-01", amount: 99, method: "cash" }); // too old for 6 months
    expect(collectedByMonth(data.documents, today, 3)).toEqual([
      { month: "2026-08", amount: 100000 },
      { month: "2026-09", amount: 0 },
      { month: "2026-10", amount: 50000 },
    ]);
  });
});
