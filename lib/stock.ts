import type { AppData, Doc, LineItem, StockItem } from "@/lib/types";
import { newId } from "@/lib/documents";

/*
  Stock: the things a business sells from a shelf (paint, taps, cables), how many are left,
  and a warning when one runs low. The Stock page is app/stock/page.tsx.
  Tested in tests/stock.test.ts.

  How "left" works:
  - Each stock item keeps the number you counted (`counted`) and when you counted it (`countedAt`).
  - An invoice line picked from stock has the item's id (`stockId`). Every invoice made after the
    count takes its quantity off: left = counted − sold on those invoices.
  - So stock is never taken off twice: editing an invoice's quantity, deleting the invoice, or
    two devices saving at once all just change the sum. Quotes never take stock off; turning a
    quote into an invoice does.
  - "Add stock" (a delivery) adds to the count. "Count again" sets a new count from today, so
    earlier invoices no longer count against it.
  - Warn when what's left is at or below `lowAt` (0 means never warn).
*/

/** The invoices that take stock off this item: made after it was counted */
function soldSinceCount(item: Pick<StockItem, "id" | "countedAt">, documents: Doc[]) {
  let sold = 0;
  for (const d of documents) {
    if (d.type !== "invoice" || d.createdAt < item.countedAt) continue;
    for (const line of d.items) if (line.stockId === item.id) sold += line.quantity;
  }
  return sold;
}

/** How many are left (can be below 0 if more was invoiced than you had) */
export function stockLeft(item: Pick<StockItem, "id" | "counted" | "countedAt">, documents: Doc[]) {
  // Rounded so 0.1 + 0.2 litres doesn't show as 0.30000000004
  return Math.round((item.counted - soldSinceCount(item, documents)) * 1000) / 1000;
}

export type StockState = "ok" | "low" | "out";

export function stockState(left: number, lowAt: number): StockState {
  if (left <= 0) return "out";
  if (lowAt > 0 && left <= lowAt) return "low";
  return "ok";
}

export type StockRow = StockItem & { left: number; state: StockState };

/** Every stock item with what's left, out of stock and running low first, then by name */
export function stockList(data: Pick<AppData, "stock" | "documents">): StockRow[] {
  const order: Record<StockState, number> = { out: 0, low: 1, ok: 2 };
  return data.stock
    .map((s) => {
      const left = stockLeft(s, data.documents);
      return { ...s, left, state: stockState(left, s.lowAt) };
    })
    .sort((a, b) => order[a.state] - order[b.state] || a.name.localeCompare(b.name));
}

/** The items that are out of stock or running low, for the warning on the Overview */
export function lowStock(data: Pick<AppData, "stock" | "documents">) {
  return stockList(data).filter((s) => s.state !== "ok");
}

/** Finds a stock item by name or code, for the search box */
export function matchesStock(item: Pick<StockItem, "name" | "code">, query: string) {
  const q = query.trim().toLowerCase();
  return !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
}

/* ---------- Changing stock ---------- */

export type StockFields = Pick<StockItem, "name" | "code" | "price" | "lowAt"> & { counted: number };

export function createStock(data: AppData, fields: StockFields, now = new Date().toISOString()) {
  const item: StockItem = { ...fields, id: newId(), countedAt: now, createdAt: now, updatedAt: now };
  return { data: { ...data, stock: [item, ...data.stock] }, item };
}

export function updateStock(data: AppData, id: string, change: Partial<Omit<StockItem, "id">>, now = new Date().toISOString()): AppData {
  return { ...data, stock: data.stock.map((s) => (s.id === id ? { ...s, ...change, id: s.id, updatedAt: now } : s)) };
}

/** A delivery: adds to what's there, without forgetting what was sold */
export function addStock(data: AppData, id: string, amount: number, now = new Date().toISOString()): AppData {
  const item = data.stock.find((s) => s.id === id);
  if (!item || !(amount > 0)) return data;
  return updateStock(data, id, { counted: item.counted + amount }, now);
}

/** You counted the shelf: this is how many there are now */
export function countStock(data: AppData, id: string, counted: number, now = new Date().toISOString()): AppData {
  if (!(counted >= 0)) return data;
  return updateStock(data, id, { counted, countedAt: now }, now);
}

/**
 * Deletes a stock item. Invoice lines that came from it keep their description and price;
 * they just stop pointing at stock.
 */
export function deleteStock(data: AppData, id: string, now = new Date().toISOString()): AppData {
  return {
    ...data,
    stock: data.stock.filter((s) => s.id !== id),
    documents: data.documents.map((d) =>
      d.items.some((i) => i.stockId === id)
        ? { ...d, items: d.items.map((i) => (i.stockId === id ? withoutStock(i) : i)), updatedAt: now }
        : d,
    ),
  };
}

/* ---------- Invoice lines ---------- */

/** Fills an invoice line from a stock item: its name, its price and the link back to it */
export function lineFromStock(line: LineItem, item: Pick<StockItem, "id" | "name" | "price">): LineItem {
  return { ...line, description: item.name, unitPrice: item.price, stockId: item.id };
}

/** The line, no longer linked to stock (its words and price stay) */
export function withoutStock(line: LineItem): LineItem {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- taking stockId out
  const { stockId, ...rest } = line;
  return rest;
}

/**
 * For the note under an invoice line: how many you had before this document (`available`), and
 * how many are left once it's counted (`after`, below 0 if you're short). Several lines of the
 * same item on one document count together. For a quote, `after` is what would be left if it
 * became an invoice.
 */
export function stockForDocument(doc: Doc, item: Pick<StockItem, "id" | "counted" | "countedAt">, documents: Doc[]) {
  const left = stockLeft(item, documents);
  const onThis = doc.items.filter((i) => i.stockId === item.id).reduce((n, i) => n + i.quantity, 0);
  const counted = doc.type === "invoice" && doc.createdAt >= item.countedAt && documents.some((d) => d.id === doc.id);
  const available = Math.round((counted ? left + onThis : left) * 1000) / 1000;
  return { available, after: Math.round((available - onThis) * 1000) / 1000 };
}

/** "12", "1,5" or "1 250" (the way South Africans write numbers), for counts of stock */
export function formatQty(n: number, lang: "en" | "af" = "en") {
  return n.toLocaleString(lang === "af" ? "af-ZA" : "en-ZA", { maximumFractionDigits: 3 });
}

/** Reads "12", "1,5" or "1.5" as a number; null if it isn't one (or is below 0) */
export function parseQty(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  return Number(clean);
}
