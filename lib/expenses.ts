import type { AppData, Expense, ExpenseCategory } from "@/lib/types";
import { totals } from "@/lib/totals";
import { newId } from "@/lib/documents";
import { toCsv } from "@/lib/csv";

/*
  Expenses and the money page (app/expenses/page.tsx): what the business spent, and from that
  its profit and the VAT it owes SARS for a period. All money is in cents.
  Tested in tests/expenses.test.ts.

  How the numbers work (South African VAT, 15%):
  - A receipt's amount includes VAT. If the supplier charged VAT (a tax invoice), the VAT part
    is amount × 15/115, and a VAT-registered business can claim it back ("input VAT").
  - Invoices you sent in the period are your sales. Their VAT is "output VAT".
  - VAT owed = output VAT − input VAT. If it's negative, SARS owes you a refund.
  - Profit = sales without VAT − expenses without the VAT you can claim back.
  It's a guide to help you plan, not tax advice.
*/

export const CATEGORY_ORDER: ExpenseCategory[] = ["materials", "fuel", "tools", "rent", "phone", "software", "bank", "marketing", "other"];

/** The VAT inside an amount that includes 15% VAT: R115 includes R15 */
export function vatInside(amount: number) {
  return Math.round((amount * 15) / 115);
}

/** The VAT on an expense that can be claimed back (0 if the supplier didn't charge VAT) */
export function claimableVat(e: Pick<Expense, "amount" | "vatClaimable">) {
  return e.vatClaimable ? vatInside(e.amount) : 0;
}

export function createExpense(data: AppData, fields: Omit<Expense, "id" | "createdAt" | "updatedAt">, now = new Date().toISOString()) {
  const expense: Expense = { ...fields, id: newId(), createdAt: now, updatedAt: now };
  return { data: { ...data, expenses: [expense, ...data.expenses] }, expense };
}

export function updateExpense(data: AppData, id: string, change: Partial<Expense>, now = new Date().toISOString()): AppData {
  return { ...data, expenses: data.expenses.map((e) => (e.id === id ? { ...e, ...change, id: e.id, updatedAt: now } : e)) };
}

export function deleteExpense(data: AppData, id: string): AppData {
  return { ...data, expenses: data.expenses.filter((e) => e.id !== id) };
}

/* ---------- Periods ---------- */

export type PeriodKey = "thisMonth" | "lastMonth" | "vatPeriod" | "taxYear";
export type Period = { key: PeriodKey; from: string; to: string }; // YYYY-MM-DD, both days included

const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m is 1–12
const range = (y1: number, m1: number, y2: number, m2: number) => ({
  from: `${y1}-${pad(m1)}-01`,
  to: `${y2}-${pad(m2)}-${pad(lastDay(y2, m2))}`,
});

/**
 * The periods the money page can show, for the day "today" (YYYY-MM-DD):
 * - VAT period: two months, the way most small VAT vendors file (Jan–Feb, Mar–Apr, … Nov–Dec)
 * - Tax year: 1 March to the end of February, like SARS
 */
export function periods(today: string): Record<PeriodKey, Period> {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const prevY = m === 1 ? y - 1 : y;
  const prevM = m === 1 ? 12 : m - 1;
  const vatStart = m % 2 === 1 ? m : m - 1;
  const taxStartY = m >= 3 ? y : y - 1;
  return {
    thisMonth: { key: "thisMonth", ...range(y, m, y, m) },
    lastMonth: { key: "lastMonth", ...range(prevY, prevM, prevY, prevM) },
    vatPeriod: { key: "vatPeriod", ...range(y, vatStart, y, vatStart + 1) },
    taxYear: { key: "taxYear", ...range(taxStartY, 3, taxStartY + 1, 2) },
  };
}

export const inPeriod = (date: string, p: Pick<Period, "from" | "to">) => date >= p.from && date <= p.to;

/* ---------- The money summary ---------- */

export type MoneySummary = {
  vatRegistered: boolean;
  invoices: number; // how many invoices were sent in the period
  sales: number; // invoiced, without VAT
  outputVat: number;
  received: number; // payments that came in during the period (may be for older invoices)
  expensesTotal: number; // what was paid, VAT included
  inputVat: number;
  expensesNet: number; // without the VAT that can be claimed back
  profit: number;
  vatOwed: number; // negative: SARS owes you
  byCategory: { category: ExpenseCategory; total: number }[]; // biggest first, only categories used
};

export function summarise(data: AppData, period: Pick<Period, "from" | "to">): MoneySummary {
  const vatRegistered = data.business.vatNumber.trim() !== "";
  const invoices = data.documents.filter((d) => d.type === "invoice" && inPeriod(d.issueDate, period));
  const sales = invoices.reduce((sum, d) => sum + totals(d).net, 0);
  const outputVat = invoices.reduce((sum, d) => sum + totals(d).vat, 0);
  const received = data.documents
    .filter((d) => d.type === "invoice")
    .flatMap((d) => d.payments)
    .filter((p) => inPeriod(p.date, period))
    .reduce((sum, p) => sum + p.amount, 0);

  const expenses = data.expenses.filter((e) => inPeriod(e.date, period));
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  // A business that isn't registered for VAT can't claim VAT back, so its expenses cost the full amount
  const inputVat = vatRegistered ? expenses.reduce((sum, e) => sum + claimableVat(e), 0) : 0;
  const expensesNet = expensesTotal - inputVat;

  const totalsByCategory = new Map<ExpenseCategory, number>();
  for (const e of expenses) totalsByCategory.set(e.category, (totalsByCategory.get(e.category) ?? 0) + e.amount);

  return {
    vatRegistered,
    invoices: invoices.length,
    sales,
    outputVat,
    received,
    expensesTotal,
    inputVat,
    expensesNet,
    profit: sales - expensesNet,
    vatOwed: outputVat - inputVat,
    byCategory: [...totalsByCategory.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total || CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)),
  };
}

/** The expenses in a period, newest first */
export function expensesIn(data: AppData, period: Pick<Period, "from" | "to">) {
  return data.expenses.filter((e) => inPeriod(e.date, period)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/** A spreadsheet of the expenses, for an accountant. headers and categoryName come in the app's language. */
export function expensesCsv(list: Expense[], headers: string[], categoryName: (c: ExpenseCategory) => string, yes: string, no: string) {
  const rand = (cents: number) => (cents / 100).toFixed(2);
  return toCsv([
    headers,
    ...list.map((e) => [e.date, e.supplier, e.description, categoryName(e.category), rand(e.amount), rand(claimableVat(e)), e.hasReceipt ? yes : no]),
  ]);
}
