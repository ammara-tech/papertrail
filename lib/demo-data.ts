import { addDays } from "@/lib/dates";
import { formatNumber } from "@/lib/documents";
import { defaultBusiness } from "@/lib/storage";
import type { AppData, Doc, Expense, StockItem } from "@/lib/types";

/*
  The made-up business a demo starts with (lib/demo.ts): a plumber in Krugersdorp with a quote
  waiting, an accepted quote, an invoice made from it with a part payment, a paid invoice, an
  overdue one, a few expenses and some stock (one item running low). Every date is worked out
  from today, so the demo always looks current. Tested in tests/demo-data.test.ts.
*/

export function demoData(today: string, nowIso: string): Pick<AppData, "business" | "documents" | "expenses" | "stock" | "counters"> {
  const base = { discountPercent: 0, vatEnabled: true, notes: "", payments: [], createdAt: nowIso, updatedAt: nowIso };
  const lerato = { name: "Lerato Dlamini", email: "lerato@example.com", phone: "", address: "8 Jacaranda Avenue\nMuldersdrift" };
  const johan = { name: "Johan van der Merwe", email: "johan@example.com", phone: "", address: "22 Protealaan\nKrugersdorp" };
  const sipho = { name: "Sipho Nkosi", email: "sipho@example.com", phone: "", address: "5 Ontdekkers Road\nRoodepoort" };
  const geyser = [
    { id: "1", description: "Replace 150 L geyser element and thermostat", quantity: 1, unitPrice: 185000 },
    { id: "2", description: "Call-out and labour (hours)", quantity: 1.5, unitPrice: 45000 },
  ];
  const q = (n: number) => formatNumber("quote", n);
  const inv = (n: number) => formatNumber("invoice", n);
  const d = (days: number) => addDays(today, days);

  const documents: Doc[] = [
    { ...base, id: "demo-q1", type: "quote", number: q(1), quoteStatus: "accepted", issueDate: d(-12), dueDate: d(2), client: lerato, items: geyser },
    {
      ...base, id: "demo-i1", type: "invoice", number: inv(1), quoteStatus: "open", issueDate: d(-8), dueDate: d(22), client: lerato, items: geyser, fromQuote: q(1),
      payments: [{ id: "p1", date: d(-8), amount: 100000, method: "eft" }],
    },
    {
      ...base, id: "demo-i2", type: "invoice", number: inv(2), quoteStatus: "open", issueDate: d(-20), dueDate: d(10), client: johan,
      items: [
        { id: "1", description: "Install new kitchen tap", quantity: 1, unitPrice: 98000 },
        { id: "2", description: "Labour (hours)", quantity: 2, unitPrice: 45000 },
      ],
      payments: [{ id: "p1", date: d(-15), amount: 216200, method: "eft" }],
    },
    {
      ...base, id: "demo-i3", type: "invoice", number: inv(3), quoteStatus: "open", issueDate: d(-45), dueDate: d(-15), client: sipho,
      items: [{ id: "1", description: "Unblock main drain", quantity: 1, unitPrice: 65000 }],
    },
    {
      ...base, id: "demo-q2", type: "quote", number: q(2), quoteStatus: "open", issueDate: d(-1), dueDate: d(13), client: sipho,
      items: [
        { id: "1", description: "Bathroom renovation: new toilet, basin and taps", quantity: 1, unitPrice: 1250000 },
        { id: "2", description: "Labour (days)", quantity: 3, unitPrice: 280000 },
      ],
    },
  ];

  const expense = (id: string, days: number, supplier: string, description: string, category: Expense["category"], amount: number): Expense => ({
    id, date: d(days), supplier, description, category, amount, vatClaimable: true, hasReceipt: false, createdAt: nowIso, updatedAt: nowIso,
  });
  const expenses: Expense[] = [
    expense("demo-e1", -10, "Builders Warehouse", "Geyser element and thermostat", "materials", 112500),
    expense("demo-e2", -6, "Engen", "Fuel for the bakkie", "fuel", 85000),
    expense("demo-e3", -3, "Vodacom", "Phone contract", "phone", 39900),
  ];

  const item = (id: string, name: string, code: string, price: number, counted: number, lowAt: number): StockItem => ({
    id, name, code, price, counted, countedAt: nowIso, lowAt, createdAt: nowIso, updatedAt: nowIso,
  });
  const stock: StockItem[] = [
    item("demo-s1", "Geyser element 3 kW", "GE-3", 65000, 6, 2),
    item("demo-s2", "Thermostat, 150 L", "TH-150", 42000, 2, 2),
    item("demo-s3", "PTFE tape", "PTFE", 1500, 40, 10),
  ];

  return {
    business: {
      ...defaultBusiness,
      name: "Mokoena Plumbing & Electrical",
      address: "14 Kerk Street\nKrugersdorp, 1739",
      phone: "082 555 0147",
      email: "hello@example.com",
      vatNumber: "4123456789",
      bankName: "Capitec Business",
      accountName: "Mokoena Plumbing & Electrical",
      accountNumber: "1052 334 871",
      branchCode: "450105",
    },
    documents,
    expenses,
    stock,
    counters: { quote: 2, invoice: 3 },
  };
}
