import type { AppData, Doc, DocType, LineItem, Payment, PaymentMethod } from "@/lib/types";
import { addDays, daysBetween } from "@/lib/dates";
import { totals } from "@/lib/totals";

/*
  Everything you can do to quotes and invoices, as plain functions:
  they take the app's data and return new data, and never change the old copy.
  That makes them easy to test (tests/documents.test.ts) and easy to save:
  lib/cloud.ts compares the old and new copies and saves only what changed.
*/

export const PREFIX: Record<DocType, string> = { quote: "QUO", invoice: "INV" };

export function formatNumber(type: DocType, n: number): string {
  return `${PREFIX[type]}-${String(n).padStart(4, "0")}`;
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function blankItem(): LineItem {
  return { id: newId(), description: "", quantity: 1, unitPrice: 0 };
}

/** A new, empty quote or invoice with the next number and the business's usual settings */
export function createDocument(data: AppData, type: DocType, today: string, now = new Date().toISOString()) {
  const n = data.counters[type] + 1;
  const b = data.business;
  const doc: Doc = {
    id: newId(),
    type,
    number: formatNumber(type, n),
    quoteStatus: "open",
    issueDate: today,
    dueDate: addDays(today, type === "quote" ? b.quoteValidDays : b.paymentTermsDays),
    client: { name: "", email: "", phone: "", address: "" },
    items: [blankItem()],
    discountPercent: 0,
    vatEnabled: b.vatByDefault,
    notes: "",
    payments: [],
    createdAt: now,
    updatedAt: now,
  };
  return { data: { ...data, documents: [doc, ...data.documents], counters: { ...data.counters, [type]: n } }, doc };
}

export function updateDocument(data: AppData, id: string, change: Partial<Doc>, now = new Date().toISOString()): AppData {
  return {
    ...data,
    documents: data.documents.map((d) => (d.id === id ? { ...d, ...change, id: d.id, type: d.type, number: d.number, updatedAt: now } : d)),
  };
}

export function deleteDocument(data: AppData, id: string): AppData {
  return { ...data, documents: data.documents.filter((d) => d.id !== id) };
}

/** A copy with a new number and today's dates, e.g. for a monthly invoice to the same client */
export function duplicateDocument(data: AppData, id: string, today: string, now = new Date().toISOString()) {
  const original = data.documents.find((d) => d.id === id);
  if (!original) return null;
  const made = createDocument(data, original.type, today, now);
  const copy: Doc = {
    ...made.doc,
    client: { ...original.client },
    items: original.items.map((i) => ({ ...i, id: newId() })),
    discountPercent: original.discountPercent,
    vatEnabled: original.vatEnabled,
    notes: original.notes,
  };
  return { data: { ...made.data, documents: made.data.documents.map((d) => (d.id === copy.id ? copy : d)) }, doc: copy };
}

/** The client said yes: mark the quote accepted and make an invoice with the same details */
export function convertToInvoice(data: AppData, quoteId: string, today: string, now = new Date().toISOString()) {
  const quote = data.documents.find((d) => d.id === quoteId && d.type === "quote");
  if (!quote) return null;
  const made = createDocument(data, "invoice", today, now);
  const invoice: Doc = {
    ...made.doc,
    client: { ...quote.client },
    items: quote.items.map((i) => ({ ...i, id: newId() })),
    discountPercent: quote.discountPercent,
    vatEnabled: quote.vatEnabled,
    notes: quote.notes,
    fromQuote: quote.number,
  };
  const documents = made.data.documents.map((d) =>
    d.id === invoice.id ? invoice : d.id === quote.id ? { ...d, quoteStatus: "accepted" as const, updatedAt: now } : d,
  );
  return { data: { ...made.data, documents }, doc: invoice };
}

/* ---------- Payments (invoices) ---------- */

export function paidAmount(doc: Pick<Doc, "payments">): number {
  return doc.payments.reduce((sum, p) => sum + p.amount, 0);
}

/** What's still owed. Never below zero, even if the client paid a little too much. */
export function balance(doc: Doc): number {
  return Math.max(0, totals(doc).total - paidAmount(doc));
}

export type InvoiceState = "unpaid" | "part-paid" | "paid";

export function invoiceState(doc: Doc): InvoiceState {
  const paid = paidAmount(doc);
  if (paid <= 0) return "unpaid";
  return paid >= totals(doc).total ? "paid" : "part-paid";
}

export function addPayment(
  data: AppData,
  id: string,
  payment: { date: string; amount: number; method: PaymentMethod },
  now = new Date().toISOString(),
): AppData {
  const doc = data.documents.find((d) => d.id === id);
  if (!doc || doc.type !== "invoice" || !(payment.amount > 0)) return data;
  const p: Payment = { id: newId(), ...payment, amount: Math.round(payment.amount) };
  return updateDocument(data, id, { payments: [...doc.payments, p].sort((a, b) => a.date.localeCompare(b.date)) }, now);
}

export function removePayment(data: AppData, id: string, paymentId: string, now = new Date().toISOString()): AppData {
  const doc = data.documents.find((d) => d.id === id);
  if (!doc) return data;
  return updateDocument(data, id, { payments: doc.payments.filter((p) => p.id !== paymentId) }, now);
}

/** "Mark as paid": one payment for whatever is still owed */
export function markPaid(data: AppData, id: string, today: string, method: PaymentMethod = "eft", now = new Date().toISOString()): AppData {
  const doc = data.documents.find((d) => d.id === id);
  if (!doc) return data;
  return addPayment(data, id, { date: today, amount: balance(doc), method }, now);
}

/* ---------- Status, summaries and search ---------- */

export function isOverdue(doc: Doc, today: string): boolean {
  return doc.type === "invoice" && balance(doc) > 0 && Boolean(doc.dueDate) && daysBetween(doc.dueDate, today) > 0;
}

export type StampLabel = "paid" | "partPaid" | "overdue" | "accepted" | "declined";

/** What the stamp on a slip says, or null for none. Overdue beats part-paid: it's what needs action. */
export function stampFor(doc: Doc, today: string): StampLabel | null {
  if (doc.type === "invoice") {
    const state = invoiceState(doc);
    if (state === "paid") return "paid";
    if (isOverdue(doc, today)) return "overdue";
    return state === "part-paid" ? "partPaid" : null;
  }
  if (doc.quoteStatus === "accepted") return "accepted";
  if (doc.quoteStatus === "declined") return "declined";
  return null;
}

/** The numbers behind the Overview page and the sentence on the Documents page */
export function summary(docs: Doc[], today: string) {
  const invoices = docs.filter((d) => d.type === "invoice");
  const owing = invoices.filter((d) => balance(d) > 0);
  const overdue = owing.filter((d) => isOverdue(d, today));
  const openQuotes = docs.filter((d) => d.type === "quote" && d.quoteStatus === "open");
  return {
    owed: owing.reduce((s, d) => s + balance(d), 0),
    unpaidCount: owing.length,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, d) => s + balance(d), 0),
    collected: invoices.reduce((s, d) => s + paidAmount(d), 0),
    openQuotesCount: openQuotes.length,
    openQuotesAmount: openQuotes.reduce((s, d) => s + totals(d).total, 0),
  };
}

/** Money received per month for the last `months` months (oldest first), from every payment */
export function collectedByMonth(docs: Doc[], today: string, months = 6) {
  const [y, m] = today.split("-").map(Number);
  const keys = Array.from({ length: months }, (_, i) => {
    const d = new Date(y, m - 1 - (months - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const totalsByKey = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const d of docs) for (const p of d.payments) if (p.date.slice(0, 7) in totalsByKey) totalsByKey[p.date.slice(0, 7)] += p.amount;
  return keys.map((month) => ({ month, amount: totalsByKey[month] }));
}

/** Search by number or client name, any capitals */
export function matches(doc: Doc, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return doc.number.toLowerCase().includes(q) || doc.client.name.toLowerCase().includes(q);
}
