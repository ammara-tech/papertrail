"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business, Client, Doc, LineItem } from "@/lib/types";
import { getData, setData } from "@/lib/store";
import { balance, blankItem, convertToInvoice, deleteDocument, duplicateDocument, isOverdue, markPaid, stampFor, updateDocument } from "@/lib/documents";
import { customerKey, customers } from "@/lib/customers";
import { lineTotal } from "@/lib/totals";
import { formatRand } from "@/lib/money";
import { todayISO } from "@/lib/dates";
import { useT } from "@/components/LangProvider";
import DocumentSheet from "@/components/DocumentSheet";
import PriceInput from "@/components/PriceInput";
import Stamp from "@/components/Stamp";
import Payments from "@/components/Payments";
import SendButtons from "@/components/SendButtons";

/*
  Editing a quote or invoice. Every change is saved straight away (to the account, or on
  the device until it's back online), and the preview beside the form (behind the Preview
  tab on phones) is exactly what prints. Download PDF uses the browser's "Save as PDF".
*/
export default function DocumentEditor({ doc, business, documents }: { doc: Doc; business: Business; documents: Doc[] }) {
  const router = useRouter();
  const t = useT();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [landed, setLanded] = useState(false); // the stamp lands only when you change the status
  const today = todayISO();
  const isQuote = doc.type === "quote";
  const stamp = stampFor(doc, today);
  const known = customers(documents);

  const change = (c: Partial<Doc>) => setData((d) => updateDocument(d, doc.id, c));
  const changeItem = (id: string, c: Partial<LineItem>) => change({ items: doc.items.map((i) => (i.id === id ? { ...i, ...c } : i)) });

  // Typing a name you've used before fills in that client's details
  function changeClientName(name: string) {
    const match = known.find((c) => c.key === customerKey(name));
    const client: Client = match && !doc.client.email && !doc.client.phone && !doc.client.address ? { ...match.client, name } : { ...doc.client, name };
    change({ client });
  }

  function open(made: { doc: Doc } | null, apply: () => void) {
    if (!made) return;
    apply();
    router.push(`/documents/${made.doc.id}`);
  }

  function downloadPdf() {
    const before = document.title;
    document.title = `${doc.number}${doc.client.name ? ` ${doc.client.name}` : ""}`; // the PDF's file name
    const restore = () => {
      document.title = before;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  function remove() {
    if (!window.confirm(t("editor.confirmDelete", { n: doc.number }))) return;
    setData((d) => deleteDocument(d, doc.id));
    router.push("/documents");
  }

  const button = "rounded-lg border border-line bg-sheet px-4 py-2 hover:border-carbon";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 print:hidden">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isQuote ? t("doc.quote") : t("doc.invoice")} <span className="font-type text-number">{doc.number}</span>
        </h1>
        {stamp && <Stamp label={stamp} land={landed} />}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={downloadPdf} className="rounded-lg bg-carbon px-4 py-2 font-semibold text-on-carbon hover:opacity-90">
          {t("editor.downloadPdf")}
        </button>
        {isQuote ? (
          <>
            {doc.quoteStatus !== "accepted" && (
              <button
                type="button"
                onClick={() => {
                  const made = convertToInvoice(getData()!, doc.id, today);
                  open(made, () => setData(() => made!.data));
                }}
                className="rounded-lg border-2 border-invoice-edge bg-invoice px-4 py-2 font-semibold text-slip-ink"
              >
                {t("editor.makeInvoice")}
              </button>
            )}
            {doc.quoteStatus === "open" ? (
              <button type="button" onClick={() => { change({ quoteStatus: "declined" }); setLanded(true); }} className={button}>
                {t("editor.declined")}
              </button>
            ) : (
              <button type="button" onClick={() => change({ quoteStatus: "open" })} className={button}>
                {t("editor.reopen")}
              </button>
            )}
          </>
        ) : (
          balance(doc) > 0 && (
            <button type="button" onClick={() => { setData((d) => markPaid(d, doc.id, today)); setLanded(true); }} className="rounded-lg border-2 border-paid/60 bg-sheet px-4 py-2 font-semibold text-paid">
              {t("editor.markPaid")}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => {
            const made = duplicateDocument(getData()!, doc.id, today);
            open(made, () => setData(() => made!.data));
          }}
          className={button}
        >
          {t("editor.duplicate")}
        </button>
        <button type="button" onClick={remove} className="rounded-lg px-4 py-2 text-overdue hover:bg-invoice/40">
          {t("editor.delete")}
        </button>
      </div>

      <div className="mt-4 print:hidden">
        <SendButtons doc={doc} business={business} kind={isOverdue(doc, today) ? "reminder" : "send"} />
      </div>

      <div role="group" aria-label={t("editor.view")} className="mt-6 flex rounded-lg border border-line bg-sheet p-1 lg:hidden print:hidden">
        {(["edit", "preview"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={tab === v}
            onClick={() => setTab(v)}
            className={`flex-1 rounded-md px-3 py-2 text-sm ${tab === v ? "bg-carbon font-semibold text-on-carbon" : "text-ink-soft"}`}
          >
            {t(`editor.tab.${v}`)}
          </button>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] print:mt-0 print:block">
        <form onSubmit={(e) => e.preventDefault()} className={`space-y-8 print:hidden ${tab === "preview" ? "hidden lg:block" : ""}`}>
          <fieldset className="rounded-xl border border-line bg-sheet p-5">
            <legend className="px-1 font-semibold">{isQuote ? t("editor.whoFor") : t("editor.whoPays")}</legend>
            <label className="block text-sm text-ink-soft">
              {t("editor.clientName")}
              <input className="field" list="known-clients" value={doc.client.name} onChange={(e) => changeClientName(e.target.value)} autoComplete="off" />
              <datalist id="known-clients">
                {known.map((c) => (
                  <option key={c.key} value={c.client.name} />
                ))}
              </datalist>
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-ink-soft">
                {t("editor.email")}
                <input className="field" type="email" value={doc.client.email} onChange={(e) => change({ client: { ...doc.client, email: e.target.value } })} />
              </label>
              <label className="block text-sm text-ink-soft">
                {t("editor.phone")}
                <input className="field" type="tel" value={doc.client.phone} onChange={(e) => change({ client: { ...doc.client, phone: e.target.value } })} placeholder="082 555 0147" />
              </label>
            </div>
            <label className="mt-3 block text-sm text-ink-soft">
              {t("editor.address")}
              <textarea className="field" rows={2} value={doc.client.address} onChange={(e) => change({ client: { ...doc.client, address: e.target.value } })} />
            </label>
          </fieldset>

          <fieldset className="rounded-xl border border-line bg-sheet p-5">
            <legend className="px-1 font-semibold">{t("editor.dates")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-ink-soft">
                {t("editor.date")}
                <input className="field" type="date" value={doc.issueDate} onChange={(e) => change({ issueDate: e.target.value })} />
              </label>
              <label className="block text-sm text-ink-soft">
                {isQuote ? t("editor.validUntil") : t("editor.paymentDue")}
                <input className="field" type="date" value={doc.dueDate} onChange={(e) => change({ dueDate: e.target.value })} />
              </label>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-line bg-sheet p-5">
            <legend className="px-1 font-semibold">{t("editor.work")}</legend>
            <ul className="space-y-4">
              {doc.items.map((item, n) => (
                <li key={item.id} className="rounded-lg bg-page/70 p-3">
                  <label className="block text-sm text-ink-soft">
                    {t("editor.line", { n: n + 1 })}
                    <textarea className="field" rows={1} placeholder={t("editor.linePlaceholder")} value={item.description} onChange={(e) => changeItem(item.id, { description: e.target.value })} />
                  </label>
                  <div className="mt-2 grid grid-cols-[5rem_minmax(0,1fr)_auto] items-end gap-3">
                    <label className="block text-sm text-ink-soft">
                      {t("editor.qty")}
                      <input
                        className="field"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        value={Number.isFinite(item.quantity) ? item.quantity : ""}
                        onChange={(e) => changeItem(item.id, { quantity: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)) })}
                      />
                    </label>
                    <label className="block text-sm text-ink-soft">
                      {t("editor.priceEach")}
                      <PriceInput cents={item.unitPrice} label={t("editor.priceFor", { n: n + 1 })} onChange={(cents) => changeItem(item.id, { unitPrice: cents })} className="field" />
                    </label>
                    <p className="pb-2 text-right font-semibold">{formatRand(lineTotal(item))}</p>
                  </div>
                  {doc.items.length > 1 && (
                    <button type="button" onClick={() => change({ items: doc.items.filter((i) => i.id !== item.id) })} className="mt-2 text-sm text-overdue underline-offset-2 hover:underline">
                      {t("editor.removeLine", { n: n + 1 })}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => change({ items: [...doc.items, blankItem()] })} className="mt-4 rounded-lg border-2 border-dashed border-line px-4 py-2 font-semibold text-carbon hover:border-carbon">
              {t("editor.addLine")}
            </button>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-ink-soft">
                {t("editor.discount")}
                <input
                  className="field"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={doc.discountPercent || ""}
                  placeholder="0"
                  onChange={(e) => change({ discountPercent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                />
              </label>
              <label className="flex items-center gap-3 self-end rounded-md border border-line px-3 py-2.5 text-[15px]">
                <input type="checkbox" className="h-5 w-5 accent-carbon" checked={doc.vatEnabled} onChange={(e) => change({ vatEnabled: e.target.checked })} />
                {t("editor.addVat")}
              </label>
            </div>
          </fieldset>

          {!isQuote && <Payments doc={doc} onStamp={() => setLanded(true)} />}

          <fieldset className="rounded-xl border border-line bg-sheet p-5">
            <legend className="px-1 font-semibold">{t("editor.notes")}</legend>
            <label className="block text-sm text-ink-soft">
              {t("editor.notesHint")}
              <textarea className="field" rows={3} value={doc.notes} onChange={(e) => change({ notes: e.target.value })} />
            </label>
          </fieldset>
        </form>

        <div className={`lg:sticky lg:top-20 ${tab === "edit" ? "hidden lg:block print:block" : ""}`}>
          <p className="mb-3 text-sm text-ink-soft print:hidden">{t("editor.previewNote")}</p>
          <DocumentSheet doc={doc} business={business} />
        </div>
      </div>
    </div>
  );
}
