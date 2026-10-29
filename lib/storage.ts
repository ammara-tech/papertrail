import type { AppData, Business, Doc, LineItem, Payment, PaymentMethod } from "@/lib/types";
import { totals } from "@/lib/totals";

/*
  Checking data before the app uses it: from the cloud, from a backup file, or from
  an older version of PaperTrail. Whatever comes in (old, broken or edited by hand),
  these functions return valid data and never crash the app.
  Tested in tests/storage.test.ts.
*/

export const defaultBusiness: Business = {
  name: "",
  email: "",
  phone: "",
  address: "",
  vatNumber: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  branchCode: "",
  logo: "",
  vatByDefault: true,
  paymentTermsDays: 30,
  quoteValidDays: 14,
  footerNote: "",
  docLanguage: "en",
};

export function emptyData(): AppData {
  return { version: 2, business: { ...defaultBusiness }, documents: [], counters: { quote: 0, invoice: 0 } };
}

export const MAX_LOGO_CHARS = 280_000; // about a 200 KB picture, well under Firestore's 1 MB document limit

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const METHODS: PaymentMethod[] = ["eft", "cash", "card", "other"];

function readItem(v: unknown, i: number): LineItem | null {
  if (!v || typeof v !== "object") return null;
  const o = obj(v);
  return { id: str(o.id, 100) || `item-${i}`, description: str(o.description, 500), quantity: Math.max(0, num(o.quantity, 1)), unitPrice: Math.round(num(o.unitPrice)) };
}

function readPayment(v: unknown, i: number): Payment | null {
  const o = obj(v);
  const amount = Math.round(num(o.amount));
  if (!(amount > 0) || !date(o.date)) return null;
  return { id: str(o.id, 100) || `payment-${i}`, date: date(o.date), amount, method: METHODS.includes(o.method as PaymentMethod) ? (o.method as PaymentMethod) : "other" };
}

export function readDoc(v: unknown): Doc | null {
  const d = obj(v);
  const type = d.type === "quote" || d.type === "invoice" ? d.type : null;
  if (!type || !str(d.id) || !str(d.number)) return null;
  const c = obj(d.client);
  const quoteStatus = ["open", "accepted", "declined"].includes(String(d.quoteStatus ?? d.status)) ? (String(d.quoteStatus ?? d.status) as Doc["quoteStatus"]) : "open";
  const doc: Doc = {
    id: str(d.id, 100),
    type,
    number: str(d.number, 30),
    quoteStatus,
    issueDate: date(d.issueDate),
    dueDate: date(d.dueDate),
    client: { name: str(c.name, 200), email: str(c.email, 200), phone: str(c.phone, 50), address: str(c.address, 500) },
    items: Array.isArray(d.items) ? d.items.slice(0, 200).map(readItem).filter((i): i is LineItem => i !== null) : [],
    discountPercent: Math.min(100, Math.max(0, num(d.discountPercent))),
    vatEnabled: d.vatEnabled !== false,
    notes: str(d.notes, 2000),
    payments: Array.isArray(d.payments) ? d.payments.slice(0, 200).map(readPayment).filter((p): p is Payment => p !== null) : [],
    createdAt: str(d.createdAt, 40),
    updatedAt: str(d.updatedAt, 40),
  };
  if (str(d.fromQuote, 30)) doc.fromQuote = str(d.fromQuote, 30);
  // PaperTrail 1 stored a "paid" status instead of payments: turn it into one payment
  if (type === "invoice" && d.status === "paid" && doc.payments.length === 0) {
    const total = totals(doc).total;
    if (total > 0) doc.payments = [{ id: "payment-0", date: date(d.paidOn) || doc.issueDate, amount: total, method: "other" }];
  }
  return doc;
}

export function readBusiness(v: unknown): Business {
  const b = obj(v);
  const out = { ...defaultBusiness } as Record<string, unknown>;
  for (const [k, def] of Object.entries(defaultBusiness)) {
    if (typeof def === "string") out[k] = typeof b[k] === "string" ? str(b[k], k === "logo" ? MAX_LOGO_CHARS : 1000) : def;
    else if (typeof def === "number") out[k] = Math.min(365, Math.max(0, Math.round(num(b[k], def))));
    else if (typeof def === "boolean") out[k] = typeof b[k] === "boolean" ? b[k] : def;
  }
  const business = out as Business;
  if (business.logo && !/^data:image\/(png|jpeg|webp);base64,/.test(business.logo)) business.logo = "";
  if (business.docLanguage !== "en" && business.docLanguage !== "af") business.docLanguage = "en";
  return business;
}

/** Builds valid app data from any object (a backup file, or the cloud's profile plus documents) */
export function readData(v: unknown): AppData {
  const o = obj(v);
  const documents = Array.isArray(o.documents) ? o.documents.map(readDoc).filter((d): d is Doc => d !== null) : [];
  const c = obj(o.counters);
  // A counter is never lower than the highest number already used, so numbers never repeat
  const highest = (prefix: string) => Math.max(0, ...documents.filter((d) => d.number.startsWith(prefix)).map((d) => Number(d.number.split("-")[1]) || 0));
  return {
    version: 2,
    business: readBusiness(o.business),
    documents,
    counters: { quote: Math.max(Math.round(num(c.quote)), highest("QUO-")), invoice: Math.max(Math.round(num(c.invoice)), highest("INV-")) },
  };
}

/** Reads a backup file's text. Not JSON at all gives empty data. */
export function parseData(raw: string | null): AppData {
  if (!raw) return emptyData();
  try {
    return readData(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}
