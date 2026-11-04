import type { AppData, Doc, Expense, StockItem } from "@/lib/types";

/*
  What changed between two copies of the data, so lib/cloud.ts saves only that:
  the documents, expenses and stock items that are new or different, the ones that were deleted, and
  whether the business details or numbering changed. Tested in tests/diff.test.ts.
*/

export type Changes = {
  profile: boolean;
  upserts: Doc[];
  deletes: string[];
  expenseUpserts: Expense[];
  expenseDeletes: string[];
  stockUpserts: StockItem[];
  stockDeletes: string[];
};

/** The items that are new or different, and the ids that were removed */
function listChanges<T extends { id: string }>(before: T[], after: T[]) {
  const old = new Map(before.map((d) => [d.id, d]));
  const now = new Set(after.map((d) => d.id));
  return {
    // Same object means unchanged (every edit makes a new object), so this is quick even with many items
    upserts: after.filter((d) => old.get(d.id) !== d && JSON.stringify(old.get(d.id)) !== JSON.stringify(d)),
    deletes: [...old.keys()].filter((id) => !now.has(id)),
  };
}

export function changesBetween(before: AppData, after: AppData): Changes {
  const docs = listChanges(before.documents, after.documents);
  const expenses = listChanges(before.expenses, after.expenses);
  const stock = listChanges(before.stock, after.stock);
  return {
    profile:
      JSON.stringify(before.business) !== JSON.stringify(after.business) ||
      JSON.stringify(before.counters) !== JSON.stringify(after.counters),
    upserts: docs.upserts,
    deletes: docs.deletes,
    expenseUpserts: expenses.upserts,
    expenseDeletes: expenses.deletes,
    stockUpserts: stock.upserts,
    stockDeletes: stock.deletes,
  };
}

export const hasChanges = (c: Changes) =>
  c.profile || c.upserts.length > 0 || c.deletes.length > 0 || c.expenseUpserts.length > 0 || c.expenseDeletes.length > 0 ||
  c.stockUpserts.length > 0 || c.stockDeletes.length > 0;
