import { describe, expect, it } from "vitest";
import { customers } from "@/lib/customers";
import { addPayment, createDocument, updateDocument } from "@/lib/documents";
import { emptyData } from "@/lib/storage";

describe("customers", () => {
  it("groups documents by client name, any capitals and spaces, and adds up what they owe", () => {
    let data = emptyData();
    data.business.vatByDefault = false;
    const add = (type: "quote" | "invoice", name: string, cents: number, date: string, phone = "") => {
      const made = createDocument(data, type, date);
      data = updateDocument(made.data, made.doc.id, {
        client: { name, email: "", phone, address: "" },
        items: [{ id: "a", description: "", quantity: 1, unitPrice: cents }],
      });
      return made.doc.id;
    };
    const first = add("invoice", "Lerato Dlamini", 100000, "2026-09-01");
    add("invoice", "  lerato   DLAMINI ", 50000, "2026-10-01", "082 555 0147");
    add("quote", "Lerato Dlamini", 999999, "2026-10-05"); // quotes aren't billed
    add("invoice", "Sunrise Guest House", 20000, "2026-10-10");
    data = addPayment(data, first, { date: "2026-09-10", amount: 100000, method: "eft" });

    const list = customers(data.documents);
    expect(list).toHaveLength(2);
    const lerato = list.find((c) => c.key === "lerato dlamini")!;
    expect(lerato.documents).toBe(3);
    expect(lerato.billed).toBe(150000);
    expect(lerato.paid).toBe(100000);
    expect(lerato.owed).toBe(50000);
    expect(lerato.client.phone).toBe("082 555 0147"); // the newest details win
    expect(list[0].key).toBe("lerato dlamini"); // who owes the most comes first
  });
});
