import { describe, expect, it } from "vitest";
import { emailLink, messageText, whatsappLink, whatsappNumber } from "@/lib/messages";
import { createDocument, updateDocument, addPayment } from "@/lib/documents";
import { emptyData } from "@/lib/storage";
import { csvCell, toCsv } from "@/lib/csv";

function invoice() {
  let data = emptyData();
  data.business = { ...data.business, name: "Mokoena Plumbing", bankName: "Capitec", accountNumber: "1052334871", branchCode: "450105", vatByDefault: false };
  const made = createDocument(data, "invoice", "2026-10-01");
  data = updateDocument(made.data, made.doc.id, {
    dueDate: "2026-10-20",
    client: { name: "Lerato Dlamini", email: "lerato@example.com", phone: "082 555 0147", address: "" },
    items: [{ id: "a", description: "", quantity: 1, unitPrice: 100000 }],
  });
  data = addPayment(data, made.doc.id, { date: "2026-10-05", amount: 25000, method: "eft" });
  return { data, doc: data.documents[0] };
}

describe("WhatsApp and email", () => {
  it("turns South African phone numbers into WhatsApp numbers", () => {
    expect(whatsappNumber("082 555 0147")).toBe("27825550147");
    expect(whatsappNumber("+27 82 555 0147")).toBe("27825550147");
    expect(whatsappNumber("+44 7700 900123")).toBe("447700900123");
    expect(whatsappNumber("12345")).toBe(null);
  });

  it("writes a reminder with the amount still owed, the late date and the banking details", () => {
    const { data, doc } = invoice();
    const text = messageText(doc, data.business, "reminder", "2026-10-29", "en");
    expect(text).toContain("Hi Lerato,");
    expect(text).toContain("was due on 20 Oct 2026");
    expect(text).toContain("R 750,00");
    expect(text).toContain("Please use INV-0001 as the reference.");
    expect(text.endsWith("Thank you, Mokoena Plumbing")).toBe(true);
  });

  it("writes the same reminder in Afrikaans", () => {
    const { data, doc } = invoice();
    const text = messageText(doc, data.business, "reminder", "2026-10-29", "af");
    expect(text).toContain("Hallo Lerato,");
    expect(text).toContain("op 20 Okt 2026 betaalbaar was");
    expect(text).toContain("takkode 450105");
  });

  it("makes links only when there's a number or address to use", () => {
    expect(whatsappLink("082 555 0147", "Hi & thanks")).toBe("https://wa.me/27825550147?text=Hi%20%26%20thanks");
    expect(whatsappLink("", "Hi")).toBe(null);
    expect(emailLink("lerato@example.com", "Invoice INV-0001", "Hi")).toBe("mailto:lerato%40example.com?subject=Invoice%20INV-0001&body=Hi");
    expect(emailLink("not an email", "x", "y")).toBe(null);
  });
});

describe("CSV", () => {
  it("quotes cells with commas and stops formulas", () => {
    expect(csvCell('Dlamini, "Lerato"')).toBe('"Dlamini, ""Lerato"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("-1250")).toBe("-1250"); // a real negative number stays a number
    expect(toCsv([["a", 1]]).startsWith("﻿a,1")).toBe(true);
  });
});
