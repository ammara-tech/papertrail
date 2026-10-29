"use client";

import Link from "next/link";
import type { Doc } from "@/lib/types";
import { totals } from "@/lib/totals";
import { formatRand } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { balance, invoiceState, stampFor } from "@/lib/documents";
import Stamp from "@/components/Stamp";
import { useLang, useT } from "@/components/LangProvider";

/*
  One quote (yellow) or invoice (pink), like a copy torn from a duplicate book:
  perforated top edge, red number, and a stamp for its status. A part-paid
  invoice also shows what's still owed. The whole slip is one link.
*/
export default function Slip({ doc, today }: { doc: Doc; today: string }) {
  const t = useT();
  const lang = useLang();
  const stamp = stampFor(doc, today);
  const isQuote = doc.type === "quote";
  const total = totals(doc).total;
  const state = isQuote ? null : invoiceState(doc);

  return (
    <Link
      href={`/documents/${doc.id}`}
      className={`perforated group relative block rounded-b-lg border-x border-b px-5 pb-5 pt-6 text-slip-ink transition-transform hover:-translate-y-0.5 ${
        isQuote ? "border-quote-edge bg-quote" : "border-invoice-edge bg-invoice"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-slip-soft">{isQuote ? t("doc.quote") : t("doc.invoice")}</span>
        <span className="font-type text-lg font-bold text-number">{t("slip.no", { n: doc.number.split("-")[1] })}</span>
      </div>
      <p className="mt-3 truncate text-lg font-semibold">{doc.client.name || t("slip.noClient")}</p>
      <p className="mt-0.5 text-sm text-slip-soft">
        {formatDate(doc.issueDate, lang)}
        {state !== "paid" && doc.dueDate
          ? `, ${isQuote ? t("slip.validUntil", { date: formatDate(doc.dueDate, lang) }) : t("slip.due", { date: formatDate(doc.dueDate, lang) })}`
          : ""}
      </p>
      {/* The amount and the stamp share a row, so the stamp never covers the text */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{formatRand(total)}</p>
          {state === "part-paid" && <p className="text-sm text-slip-soft">{t("slip.stillOwed", { amount: formatRand(balance(doc)) })}</p>}
        </div>
        {stamp && (
          <span className="mb-1 shrink-0">
            <Stamp label={stamp} onSlip />
          </span>
        )}
      </div>
    </Link>
  );
}
