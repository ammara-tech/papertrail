"use client";

import DocumentSheet from "@/components/DocumentSheet";
import type { Business, Doc } from "@/lib/types";
import type { StampLabel } from "@/lib/documents";
import { defaultBusiness } from "@/lib/storage";
import { translate } from "@/lib/i18n";

/*
  Three real PaperTrail documents with made-up details, overlapping like pages on a desk.
  Each one shows something the app does:
    back:   a quote the client accepted
    middle: a tax invoice made from that quote, with a part payment (15% VAT, balance due)
    front:  an invoice in Afrikaans, paid in full
  They use the same DocumentSheet as the app, so they can never look different from the real thing.
  Decorative only: the wrapper hides them from screen readers.
*/

const business: Business = {
  ...defaultBusiness,
  name: "Mokoena Plumbing & Electrical",
  address: "14 Kerk Street\nKrugersdorp, 1739",
  phone: "082 555 0147",
  email: "hello@mokoenaplumbing.co.za",
  vatNumber: "4123456789",
  bankName: "Capitec Business",
  accountName: "Mokoena Plumbing & Electrical",
  accountNumber: "1052 334 871",
  branchCode: "450105",
};

const base = { discountPercent: 0, vatEnabled: true, notes: "", payments: [], createdAt: "", updatedAt: "" };
const lerato = { name: "Lerato Dlamini", email: "lerato@example.com", phone: "", address: "8 Jacaranda Avenue\nMuldersdrift" };
const geyser = [
  { id: "1", description: "Replace 150 L geyser element and thermostat", quantity: 1, unitPrice: 185000 },
  { id: "2", description: "Call-out and labour (hours)", quantity: 1.5, unitPrice: 45000 },
];

const quote: Doc = { ...base, id: "s1", type: "quote", number: "QUO-0038", quoteStatus: "accepted", issueDate: "2026-10-22", dueDate: "2026-11-05", client: lerato, items: geyser };

const partPaid: Doc = {
  ...base, id: "s2", type: "invoice", number: "INV-0042", quoteStatus: "open", issueDate: "2026-10-29", dueDate: "2026-11-28",
  client: lerato, items: geyser, fromQuote: "QUO-0038",
  payments: [{ id: "p", date: "2026-10-29", amount: 100000, method: "eft" }],
};

const paidAf: Doc = {
  ...base, id: "s3", type: "invoice", number: "INV-0041", quoteStatus: "open", issueDate: "2026-10-15", dueDate: "2026-11-14",
  client: { name: "Johan van der Merwe", email: "johan@example.com", phone: "", address: "22 Protealaan\nKrugersdorp" },
  items: [
    { id: "1", description: "Nuwe kombuiskraan installeer", quantity: 1, unitPrice: 98000 },
    { id: "2", description: "Arbeid (ure)", quantity: 2, unitPrice: 45000 },
  ],
  payments: [{ id: "p", date: "2026-10-20", amount: 216200, method: "eft" }],
};

/* Stamp colours fixed for white paper, so they read the same in light and dark mode */
const ink: Record<"accepted" | "partPaid" | "paid", string> = { accepted: "text-[#1e3a8a]", partPaid: "text-[#a14d06]", paid: "text-[#14743c]" };

function Page({ doc, lang, stamp, at }: { doc: Doc; lang: "en" | "af"; stamp: "accepted" | "partPaid" | "paid"; at: string }) {
  return (
    <div className="relative w-[600px] rounded-sm">
      <DocumentSheet doc={doc} business={{ ...business, docLanguage: lang }} />
      <span className={`stamp absolute ${at} bg-white/70 ${ink[stamp]}`}>{translate(lang, `stamp.${stamp as StampLabel}`)}</span>
    </div>
  );
}

export default function SampleDocuments() {
  const shadow = "shadow-[0_24px_50px_-18px_rgba(14,22,40,0.55)]";
  return (
    <div className="relative h-full w-full">
      <div className={`absolute left-[2%] top-[7%] origin-top-left rotate-[-7deg] scale-[0.44] ${shadow}`}>
        <Page doc={quote} lang="en" stamp="accepted" at="left-6 top-[470px] text-2xl" />
      </div>
      <div className={`absolute left-[29%] top-[13%] origin-top-left rotate-[3deg] scale-[0.5] ${shadow}`}>
        <Page doc={partPaid} lang="en" stamp="partPaid" at="left-6 top-[430px] text-2xl" />
      </div>
      <div className={`absolute left-[57%] top-[42%] origin-top-left rotate-[-3deg] scale-[0.36] ${shadow}`}>
        <Page doc={paidAf} lang="af" stamp="paid" at="right-12 top-60 text-4xl" />
      </div>
    </div>
  );
}
