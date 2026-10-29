/*
  The shapes of PaperTrail's data. Each signed-in user's data is saved in their own
  part of the Firestore database (lib/cloud.ts), and a copy is kept on the device so
  it works offline. Money is always stored in cents (whole numbers), so adding up
  never gives answers like R 0,30000000004.
*/

export type Lang = "en" | "af";
export type DocType = "quote" | "invoice";

/** Quotes stay open until the client says yes or no. An invoice's state comes from its payments. */
export type QuoteStatus = "open" | "accepted" | "declined";

export type LineItem = {
  id: string;
  description: string;
  quantity: number; // can be a decimal, e.g. 1.5 hours
  unitPrice: number; // cents
};

export type Client = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type PaymentMethod = "eft" | "cash" | "card" | "other";

export type Payment = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // cents
  method: PaymentMethod;
};

export type Doc = {
  id: string;
  type: DocType;
  number: string; // "QUO-0001" or "INV-0001"
  quoteStatus: QuoteStatus; // only used for quotes
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD: "valid until" on a quote, "due" on an invoice
  client: Client;
  items: LineItem[];
  discountPercent: number; // 0 to 100
  vatEnabled: boolean;
  notes: string;
  payments: Payment[]; // only used for invoices: deposits and part payments
  fromQuote?: string; // the quote number this invoice was made from
  createdAt: string; // ISO timestamp
  updatedAt: string;
};

export type Business = {
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  logo: string; // a small image saved as a data: URL, or ""
  vatByDefault: boolean;
  paymentTermsDays: number;
  quoteValidDays: number;
  footerNote: string;
  docLanguage: Lang; // the language printed on quotes and invoices
};

export type AppData = {
  version: 2;
  business: Business;
  documents: Doc[];
  counters: Record<DocType, number>; // the last number used for each type
};
