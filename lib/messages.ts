import type { Business, Doc, Lang } from "@/lib/types";
import { balance } from "@/lib/documents";
import { totals } from "@/lib/totals";
import { formatRand } from "@/lib/money";
import { formatDate } from "@/lib/dates";

/*
  Ready-made messages for sending a quote or invoice, or a payment reminder,
  by WhatsApp or email. PaperTrail never sends anything itself: these open the
  user's own WhatsApp or email app with the message filled in, so they can check
  it and press Send. Tested in tests/messages.test.ts.
*/

/** South African numbers for WhatsApp: "082 555 0147" or "+27 82 555 0147" → "27825550147" */
export function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return `27${digits.slice(1)}`;
  if (/^27\d{9}$/.test(digits)) return digits;
  if (/^\d{10,15}$/.test(digits) && phone.trim().startsWith("+")) return digits; // other countries, written with +
  return null;
}

export type MessageKind = "send" | "reminder";

export function messageText(doc: Doc, business: Business, kind: MessageKind, today: string, lang: Lang): string {
  const first = doc.client.name.trim().split(/\s+/)[0] || "";
  const who = business.name.trim() || (lang === "af" ? "Ons span" : "Our team");
  const total = formatRand(totals(doc).total);
  const owed = formatRand(balance(doc));
  const due = doc.dueDate ? formatDate(doc.dueDate, lang) : "";
  const bank =
    business.accountNumber.trim() &&
    (lang === "af"
      ? `Jy kan per EFT betaal aan ${business.accountName || who}, ${business.bankName}, rekening ${business.accountNumber}${business.branchCode ? `, takkode ${business.branchCode}` : ""}. Gebruik asseblief ${doc.number} as verwysing.`
      : `You can pay by EFT to ${business.accountName || who}, ${business.bankName}, account ${business.accountNumber}${business.branchCode ? `, branch code ${business.branchCode}` : ""}. Please use ${doc.number} as the reference.`);
  const late = doc.dueDate && doc.dueDate < today;

  const lines =
    lang === "af"
      ? kind === "send"
        ? doc.type === "quote"
          ? [`Hallo ${first}`.trim() + ",", `Hier is kwotasie ${doc.number} vir ${total}${due ? `, geldig tot ${due}` : ""}. Laat weet my gerus as jy enige vrae het.`]
          : [`Hallo ${first}`.trim() + ",", `Hier is faktuur ${doc.number} vir ${total}${due ? `, betaalbaar teen ${due}` : ""}.`, bank]
        : [`Hallo ${first}`.trim() + ",", `'n Vriendelike herinnering dat faktuur ${doc.number} ${late ? `op ${due} betaalbaar was` : `teen ${due} betaalbaar is`}. Uitstaande bedrag: ${owed}.`, bank]
      : kind === "send"
        ? doc.type === "quote"
          ? [`Hi ${first}`.trim() + ",", `Here's quote ${doc.number} for ${total}${due ? `, valid until ${due}` : ""}. Let me know if you have any questions.`]
          : [`Hi ${first}`.trim() + ",", `Here's invoice ${doc.number} for ${total}${due ? `, due by ${due}` : ""}.`, bank]
        : [`Hi ${first}`.trim() + ",", `A friendly reminder that invoice ${doc.number} ${late ? `was due on ${due}` : `is due by ${due}`}. Amount still owed: ${owed}.`, bank];

  return [...lines.filter(Boolean), lang === "af" ? `Dankie, ${who}` : `Thank you, ${who}`].join("\n\n");
}

export function whatsappLink(phone: string, text: string): string | null {
  const n = whatsappNumber(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

export function emailLink(email: string, subject: string, text: string): string | null {
  const to = email.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return null;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}
