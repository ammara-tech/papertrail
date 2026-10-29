"use client";

import { useState } from "react";
import type { Doc, PaymentMethod } from "@/lib/types";
import { addPayment, balance, paidAmount, removePayment } from "@/lib/documents";
import { setData } from "@/lib/store";
import { formatRand } from "@/lib/money";
import { formatDate, todayISO } from "@/lib/dates";
import { totals } from "@/lib/totals";
import { useLang, useT } from "@/components/LangProvider";
import PriceInput from "@/components/PriceInput";

/*
  Payments on an invoice: deposits and part payments, each with a date and how it was paid.
  The balance (total minus payments) shows on the invoice, and the stamp changes to
  Part paid or Paid by itself.
*/
const METHODS: PaymentMethod[] = ["eft", "cash", "card", "other"];

export default function Payments({ doc, onStamp }: { doc: Doc; onStamp: () => void }) {
  const t = useT();
  const lang = useLang();
  const owed = balance(doc);
  const [amount, setAmount] = useState(owed);
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>("eft");

  function add() {
    if (!(amount > 0)) return;
    setData((d) => addPayment(d, doc.id, { date, amount, method }));
    setAmount(Math.max(0, owed - amount));
    onStamp();
  }

  return (
    <fieldset className="rounded-xl border border-line bg-sheet p-5">
      <legend className="px-1 font-semibold">{t("payments.title")}</legend>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-ink-soft">{t("payments.total")}</dt>
          <dd className="font-semibold">{formatRand(totals(doc).total)}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">{t("payments.paid")}</dt>
          <dd className="font-semibold text-paid">{formatRand(paidAmount(doc))}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">{t("payments.balance")}</dt>
          <dd className={`font-semibold ${owed > 0 ? "text-overdue" : "text-paid"}`}>{formatRand(owed)}</dd>
        </div>
      </dl>

      {doc.payments.length > 0 && (
        <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
          {doc.payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-[15px]">
              <span className="font-semibold">{formatRand(p.amount)}</span>
              <span className="text-ink-soft">
                {formatDate(p.date, lang)}, {t(`payments.method.${p.method}`)}
              </span>
              <button
                type="button"
                onClick={() => setData((d) => removePayment(d, doc.id, p.id))}
                className="ml-auto text-sm text-overdue underline-offset-2 hover:underline"
              >
                {t("payments.remove")}
                <span className="sr-only"> {formatRand(p.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {owed > 0 && (
        <div className="mt-4 grid grid-cols-2 items-end gap-3">
          <label className="block text-sm text-ink-soft">
            {t("payments.amount")}
            <PriceInput cents={amount} onChange={setAmount} label={t("payments.amount")} className="field" />
          </label>
          <label className="block text-sm text-ink-soft">
            {t("payments.date")}
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          </label>
          <label className="col-span-2 block text-sm text-ink-soft sm:col-span-1">
            {t("payments.how")}
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="field">
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`payments.method.${m}`)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={add} disabled={!(amount > 0)} className="col-span-2 rounded-lg border-2 border-paid/60 px-4 py-2.5 font-semibold text-paid disabled:opacity-50 sm:col-span-1">
            {t("payments.add")}
          </button>
        </div>
      )}
    </fieldset>
  );
}
