import { describe, expect, it } from "vitest";
import {
  addStock,
  countStock,
  createStock,
  deleteStock,
  formatQty,
  lineFromStock,
  lowStock,
  matchesStock,
  parseQty,
  stockForDocument,
  stockLeft,
  stockList,
  stockState,
  withoutStock,
} from "@/lib/stock";
import { convertToInvoice, createDocument, deleteDocument, duplicateDocument, updateDocument } from "@/lib/documents";
import { emptyData, readData, readStock } from "@/lib/storage";
import { changesBetween, hasChanges } from "@/lib/diff";
import type { AppData, DocType } from "@/lib/types";

const today = "2026-11-04";
const paint = { name: "Plascon 5L white", code: "PDV-5W", price: 89900, counted: 10, lowAt: 3 };

/** A business with 10 tins of paint, counted at 08:00 */
function shop() {
  return createStock(emptyData(), paint, "2026-11-04T08:00:00.000Z");
}

/** Adds a quote or invoice for `qty` tins of the stock item, made at `at` */
function sell(data: AppData, stockId: string, qty: number, at: string, type: DocType = "invoice") {
  const made = createDocument(data, type, today, at);
  const item = data.stock.find((s) => s.id === stockId)!;
  const line = lineFromStock({ id: "l1", description: "", quantity: qty, unitPrice: 0 }, item);
  return { data: updateDocument(made.data, made.doc.id, { items: [line] }, at), doc: made.doc };
}

const left = (data: AppData, id: string) => stockLeft(data.stock.find((s) => s.id === id)!, data.documents);

describe("what's left", () => {
  it("takes invoices off the count", () => {
    const { data, item } = shop();
    const after = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z").data;
    expect(left(after, item.id)).toBe(6);
  });

  it("doesn't take quotes off, until the quote becomes an invoice", () => {
    const { data, item } = shop();
    const quoted = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z", "quote");
    expect(left(quoted.data, item.id)).toBe(10);
    const invoiced = convertToInvoice(quoted.data, quoted.doc.id, today, "2026-11-04T10:00:00.000Z")!;
    expect(left(invoiced.data, item.id)).toBe(6);
  });

  it("follows the invoice when it's edited or deleted, so nothing is taken off twice", () => {
    const { data, item } = shop();
    const sold = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z");
    const line = sold.data.documents[0].items[0];
    const edited = updateDocument(sold.data, sold.doc.id, { items: [{ ...line, quantity: 7 }] });
    expect(left(edited, item.id)).toBe(3);
    expect(left(deleteDocument(edited, sold.doc.id), item.id)).toBe(10);
  });

  it("counts a duplicated invoice as a new sale", () => {
    const { data, item } = shop();
    const sold = sell(data, item.id, 2, "2026-11-04T09:00:00.000Z");
    const copy = duplicateDocument(sold.data, sold.doc.id, today, "2026-11-04T09:30:00.000Z")!;
    expect(left(copy.data, item.id)).toBe(6);
  });

  it("can go below 0 when more was invoiced than you had", () => {
    const { data, item } = shop();
    expect(left(sell(data, item.id, 12, "2026-11-04T09:00:00.000Z").data, item.id)).toBe(-2);
  });

  it("handles part quantities without rounding errors", () => {
    const { data, item } = createStock(emptyData(), { ...paint, counted: 1 }, "2026-11-04T08:00:00.000Z");
    let d = sell(data, item.id, 0.1, "2026-11-04T09:00:00.000Z").data;
    d = sell(d, item.id, 0.2, "2026-11-04T09:01:00.000Z").data;
    expect(left(d, item.id)).toBe(0.7);
  });
});

describe("deliveries and counting", () => {
  it("adds a delivery to what's there, keeping what was sold", () => {
    const { data, item } = shop();
    const sold = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z").data;
    expect(left(addStock(sold, item.id, 5), item.id)).toBe(11);
  });

  it("starts again from a new count: earlier invoices no longer count against it", () => {
    const { data, item } = shop();
    const sold = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z").data;
    const counted = countStock(sold, item.id, 8, "2026-11-04T12:00:00.000Z");
    expect(left(counted, item.id)).toBe(8);
    expect(left(sell(counted, item.id, 1, "2026-11-04T13:00:00.000Z").data, item.id)).toBe(7);
  });

  it("ignores a delivery of nothing and a count below 0", () => {
    const { data, item } = shop();
    expect(addStock(data, item.id, 0)).toBe(data);
    expect(countStock(data, item.id, -1)).toBe(data);
  });
});

describe("running low", () => {
  it("says out, low or fine", () => {
    expect(stockState(0, 3)).toBe("out");
    expect(stockState(-2, 3)).toBe("out");
    expect(stockState(3, 3)).toBe("low");
    expect(stockState(4, 3)).toBe("ok");
    expect(stockState(1, 0)).toBe("ok"); // 0: never warn (until it runs out)
  });

  it("lists out and low items first, then by name", () => {
    let data = emptyData();
    for (const [name, counted] of [["Taps", 20], ["Cable", 2], ["Brushes", 0]] as const) {
      data = createStock(data, { ...paint, name, counted }, "2026-11-04T08:00:00.000Z").data;
    }
    expect(stockList(data).map((s) => [s.name, s.state])).toEqual([
      ["Brushes", "out"],
      ["Cable", "low"],
      ["Taps", "ok"],
    ]);
    expect(lowStock(data).map((s) => s.name)).toEqual(["Brushes", "Cable"]);
  });

  it("finds items by name or code", () => {
    expect(matchesStock(paint, "plascon")).toBe(true);
    expect(matchesStock(paint, "pdv")).toBe(true);
    expect(matchesStock(paint, "tap")).toBe(false);
    expect(matchesStock(paint, " ")).toBe(true);
  });
});

describe("on an invoice", () => {
  it("fills in the line's name and price from stock, and can let go of it again", () => {
    const { item } = shop();
    const line = lineFromStock({ id: "l", description: "", quantity: 2, unitPrice: 0 }, item);
    expect(line).toEqual({ id: "l", description: "Plascon 5L white", quantity: 2, unitPrice: 89900, stockId: item.id });
    expect(withoutStock(line)).toEqual({ id: "l", description: "Plascon 5L white", quantity: 2, unitPrice: 89900 });
  });

  it("says how many you had and how many are left after this invoice", () => {
    const { data, item } = shop();
    const sold = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z");
    const doc = sold.data.documents.find((d) => d.id === sold.doc.id)!;
    expect(stockForDocument(doc, sold.data.stock[0], sold.data.documents)).toEqual({ available: 10, after: 6 });
  });

  it("says what a quote would leave, without taking it off yet", () => {
    const { data, item } = shop();
    const quoted = sell(data, item.id, 12, "2026-11-04T09:00:00.000Z", "quote");
    const doc = quoted.data.documents.find((d) => d.id === quoted.doc.id)!;
    expect(stockForDocument(doc, quoted.data.stock[0], quoted.data.documents)).toEqual({ available: 10, after: -2 });
  });

  it("keeps invoice lines when their stock item is deleted", () => {
    const { data, item } = shop();
    const sold = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z").data;
    const after = deleteStock(sold, item.id);
    expect(after.stock).toEqual([]);
    expect(after.documents[0].items[0]).toEqual({ id: "l1", description: "Plascon 5L white", quantity: 4, unitPrice: 89900 });
  });
});

describe("saving and reading stock", () => {
  it("saves new, changed and deleted stock items", () => {
    const { data, item } = shop();
    expect(changesBetween(emptyData(), data).stockUpserts.map((s) => s.id)).toEqual([item.id]);
    expect(hasChanges(changesBetween(data, addStock(data, item.id, 1)))).toBe(true);
    expect(changesBetween(data, deleteStock(data, item.id)).stockDeletes).toEqual([item.id]);
  });

  it("reads stock from a backup, keeps lines' links, and fixes impossible values", () => {
    const { data, item } = shop();
    const sold = sell(data, item.id, 4, "2026-11-04T09:00:00.000Z").data;
    const back = readData(JSON.parse(JSON.stringify(sold)));
    expect(back.stock).toHaveLength(1);
    expect(back.stock[0]).toMatchObject(sold.stock[0]);
    expect(back.documents[0].items[0].stockId).toBe(item.id);
    expect(readStock({ id: "x", name: "  " })).toBeNull();
    expect(readStock({ id: "x", name: "Taps", price: -5, counted: -1, lowAt: "lots", createdAt: "2026-01-01" })).toMatchObject({
      price: 0,
      counted: 0,
      lowAt: 0,
      code: "",
      countedAt: "2026-01-01",
    });
  });

  it("reads backups from before stock existed", () => {
    expect(readData({ documents: [] }).stock).toEqual([]);
  });
});

describe("numbers", () => {
  it("reads counts typed either way, and writes them the South African way", () => {
    expect(parseQty("12")).toBe(12);
    expect(parseQty("1,5")).toBe(1.5);
    expect(parseQty(" 2.25 ")).toBe(2.25);
    expect(parseQty("-1")).toBeNull();
    expect(parseQty("lots")).toBeNull();
    expect(formatQty(1.5)).toBe("1,5");
    expect(formatQty(12)).toBe("12");
  });
});
