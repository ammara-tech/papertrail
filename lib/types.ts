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
  stockId?: string; // the stock item this line came from (lib/stock.ts); invoices take it off what's left
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

/** What an expense was for, so the money page can show where the money goes */
export type ExpenseCategory =
  | "materials"
  | "fuel"
  | "tools"
  | "rent"
  | "phone"
  | "software"
  | "bank"
  | "marketing"
  | "other";

/**
 * Something the business paid for. amount is what was paid, VAT included.
 * vatClaimable: the supplier charged VAT and the receipt is a tax invoice, so the VAT can be
 * claimed back from SARS (only for VAT-registered businesses). The receipt photo, if there is
 * one, is saved separately (lib/cloud.ts), so the list of expenses stays small and quick.
 */
export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  supplier: string;
  description: string;
  category: ExpenseCategory;
  amount: number; // cents, VAT included
  vatClaimable: boolean;
  hasReceipt: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Something the business sells from a shelf. What's left isn't stored: it's worked out from
 * `counted` and the invoices made since `countedAt` (lib/stock.ts), so it can never drift.
 */
export type StockItem = {
  id: string;
  name: string; // what goes on the invoice line, e.g. "Plascon Double Velvet 5L, white"
  code: string; // your own product code, or ""
  price: number; // selling price each, cents (VAT is added on the invoice if it's switched on)
  counted: number; // how many there were when last counted, plus deliveries since
  countedAt: string; // ISO timestamp of the last count
  lowAt: number; // warn when this many or fewer are left (0: never warn)
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  version: 2;
  business: Business;
  documents: Doc[];
  expenses: Expense[];
  stock: StockItem[];
  counters: Record<DocType, number>; // the last number used for each type
};
