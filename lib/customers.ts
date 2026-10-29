import type { Client, Doc } from "@/lib/types";
import { balance, paidAmount } from "@/lib/documents";
import { totals } from "@/lib/totals";

/*
  The Customers page is built from your documents: every client you've quoted or
  invoiced, grouped by name (any capitals, extra spaces ignored), with their
  latest contact details and what they've been billed, paid and still owe.
  Tested in tests/customers.test.ts.
*/

export type Customer = {
  key: string;
  client: Client; // the most recent details used
  documents: number;
  billed: number; // invoices only, cents
  paid: number;
  owed: number;
  lastDate: string;
};

export const customerKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

export function customers(docs: Doc[]): Customer[] {
  const byKey = new Map<string, Customer>();
  const sorted = [...docs].sort((a, b) => a.issueDate.localeCompare(b.issueDate)); // oldest first, so newest details win
  for (const d of sorted) {
    const key = customerKey(d.client.name);
    if (!key) continue;
    const c = byKey.get(key) ?? { key, client: d.client, documents: 0, billed: 0, paid: 0, owed: 0, lastDate: d.issueDate };
    c.documents += 1;
    c.lastDate = d.issueDate;
    c.client = {
      name: d.client.name.trim() || c.client.name,
      email: d.client.email || c.client.email,
      phone: d.client.phone || c.client.phone,
      address: d.client.address || c.client.address,
    };
    if (d.type === "invoice") {
      c.billed += totals(d).total;
      c.paid += paidAmount(d);
      c.owed += balance(d);
    }
    byKey.set(key, c);
  }
  return [...byKey.values()].sort((a, b) => b.owed - a.owed || b.lastDate.localeCompare(a.lastDate));
}
