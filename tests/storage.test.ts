import { describe, expect, it } from "vitest";
import { emptyData, parseData, readData } from "@/lib/storage";

describe("checking data", () => {
  it("starts empty when there's nothing, or it's broken", () => {
    expect(parseData(null)).toEqual(emptyData());
    expect(parseData("not json")).toEqual(emptyData());
    expect(parseData("42")).toEqual(emptyData());
  });

  it("keeps good documents and drops broken ones", () => {
    const data = readData({
      documents: [
        { id: "1", type: "invoice", number: "INV-0003", items: [{ id: "a", description: "Work", quantity: 2, unitPrice: 1000 }] },
        { id: "2", type: "receipt", number: "X-1" },
        "nonsense",
      ],
    });
    expect(data.documents).toHaveLength(1);
    expect(data.documents[0].items[0].unitPrice).toBe(1000);
  });

  it("never reuses a number, even if the counter was lost", () => {
    expect(readData({ documents: [{ id: "1", type: "invoice", number: "INV-0009" }], counters: { invoice: 2 } }).counters.invoice).toBe(9);
  });

  it("fixes impossible values instead of crashing", () => {
    const data = readData({
      business: { name: 42, paymentTermsDays: -5, logo: "javascript:alert(1)", docLanguage: "fr" },
      documents: [{ id: "1", type: "quote", number: "QUO-0001", quoteStatus: "paid", discountPercent: 400, payments: [{ amount: -5, date: "2026-01-01" }] }],
    });
    expect(data.business.name).toBe("");
    expect(data.business.paymentTermsDays).toBe(0);
    expect(data.business.logo).toBe("");
    expect(data.business.docLanguage).toBe("en");
    expect(data.documents[0].quoteStatus).toBe("open");
    expect(data.documents[0].discountPercent).toBe(100);
    expect(data.documents[0].payments).toEqual([]);
  });

  it("turns a PaperTrail 1 'paid' invoice into one full payment", () => {
    const data = readData({
      documents: [{ id: "1", type: "invoice", number: "INV-0001", status: "paid", paidOn: "2026-10-20", vatEnabled: false, items: [{ id: "a", quantity: 1, unitPrice: 5000 }] }],
    });
    expect(data.documents[0].payments).toEqual([{ id: "payment-0", date: "2026-10-20", amount: 5000, method: "other" }]);
  });
});
