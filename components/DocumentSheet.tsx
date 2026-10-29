"use client";

import type { Business, Doc } from "@/lib/types";
import { lineTotal, totals, VAT_RATE } from "@/lib/totals";
import { formatRand } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { balance, paidAmount } from "@/lib/documents";
import { translate, type Key } from "@/lib/i18n";

/*
  The quote or invoice as the client sees it: the live preview in the editor, and
  exactly what's printed or saved as PDF. Always white paper with one carbon-blue line,
  in the business's chosen document language (Business details), whatever language
  the app is in. A VAT-registered business charging VAT gets "Tax invoice", as SARS requires.
*/
export default function DocumentSheet({ doc, business }: { doc: Doc; business: Business }) {
  const lang = business.docLanguage;
  const d = (key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const t = totals(doc);
  const isQuote = doc.type === "quote";
  const title = isQuote ? d("sheet.quote") : doc.vatEnabled && business.vatNumber.trim() ? d("sheet.taxInvoice") : d("sheet.invoice");
  const lines = doc.items.filter((i) => i.description.trim() || i.unitPrice !== 0);
  const paid = isQuote ? 0 : paidAmount(doc);
  const hasBank = !isQuote && (business.bankName || business.accountNumber);

  return (
    <article className="sheet-print @container mx-auto w-full max-w-[210mm] bg-paper p-5 text-[13px] leading-relaxed text-paper-ink shadow-[0_1px_2px_rgba(27,34,51,0.08),0_12px_32px_-12px_rgba(30,58,138,0.25)] sm:p-12">
      <header className="grid items-start gap-6 border-b-2 border-paper-accent pb-6 @md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small data: URL saved with the business details */}
          {business.logo && <img src={business.logo} alt="" className="mb-3 max-h-16 max-w-48 object-contain" />}
          <p className="text-lg font-bold">{business.name || d("sheet.yourBusiness")}</p>
          <p className="whitespace-pre-line text-paper-soft">{business.address}</p>
          {business.phone && <p className="text-paper-soft">{business.phone}</p>}
          {business.email && <p className="text-paper-soft">{business.email}</p>}
          {business.vatNumber && <p className="text-paper-soft">{d("sheet.vatNumber", { n: business.vatNumber })}</p>}
        </div>
        <div className="@md:text-right">
          <p className="text-3xl font-bold tracking-tight text-paper-accent">{title}</p>
          <p className="mt-1 font-semibold">{doc.number}</p>
          <dl className="mt-2 text-paper-soft">
            <Meta label={d("sheet.date")} value={formatDate(doc.issueDate, lang)} />
            {doc.dueDate && <Meta label={isQuote ? d("sheet.validUntil") : d("sheet.due")} value={formatDate(doc.dueDate, lang)} />}
            {doc.fromQuote && <Meta label={d("sheet.fromQuote")} value={doc.fromQuote} />}
          </dl>
        </div>
      </header>

      <section className="mt-6">
        <p className="text-paper-soft">{isQuote ? d("sheet.preparedFor") : d("sheet.billTo")}</p>
        <p className="text-base font-semibold">{doc.client.name || d("sheet.clientName")}</p>
        <p className="whitespace-pre-line text-paper-soft">{doc.client.address}</p>
        {doc.client.phone && <p className="text-paper-soft">{doc.client.phone}</p>}
        {doc.client.email && <p className="text-paper-soft">{doc.client.email}</p>}
      </section>

      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="border-b border-paper-line text-left text-paper-soft">
            <th scope="col" className="py-2 pr-3 font-medium">{d("sheet.description")}</th>
            <th scope="col" className="w-14 py-2 pr-3 text-right font-medium">{d("sheet.qty")}</th>
            <th scope="col" className="w-28 py-2 pr-3 text-right font-medium">{d("sheet.price")}</th>
            <th scope="col" className="w-28 py-2 text-right font-medium">{d("sheet.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-paper-soft">
                {d("sheet.empty")}
              </td>
            </tr>
          ) : (
            lines.map((i) => (
              <tr key={i.id} className="border-b border-paper-line/70 align-top">
                <td className="whitespace-pre-line py-2.5 pr-3">{i.description}</td>
                <td className="py-2.5 pr-3 text-right">{i.quantity}</td>
                <td className="py-2.5 pr-3 text-right">{formatRand(i.unitPrice)}</td>
                <td className="py-2.5 text-right">{formatRand(lineTotal(i))}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-full max-w-64 space-y-1">
        <Row label={d("sheet.subtotal")} value={formatRand(t.subtotal)} />
        {t.discount > 0 && <Row label={d("sheet.discount", { pct: doc.discountPercent })} value={`− ${formatRand(t.discount)}`} />}
        {doc.vatEnabled && <Row label={d("sheet.vat", { pct: VAT_RATE * 100 })} value={formatRand(t.vat)} />}
        <div className="flex justify-between border-t-2 border-paper-accent pt-2 text-base font-bold">
          <dt>{isQuote ? d("sheet.total") : paid > 0 ? d("sheet.total") : d("sheet.totalDue")}</dt>
          <dd>{formatRand(t.total)}</dd>
        </div>
        {paid > 0 && (
          <>
            <Row label={d("sheet.paid")} value={`− ${formatRand(paid)}`} />
            <div className="flex justify-between pt-1 text-base font-bold">
              <dt>{d("sheet.balanceDue")}</dt>
              <dd>{formatRand(balance(doc))}</dd>
            </div>
          </>
        )}
      </dl>

      {(hasBank || doc.notes || business.footerNote) && (
        <footer className="mt-10 grid gap-6 border-t border-paper-line pt-6 sm:grid-cols-2">
          {hasBank && (
            <div>
              <p className="font-semibold">{d("sheet.banking")}</p>
              <p className="text-paper-soft">
                {business.accountName && <>{business.accountName}<br /></>}
                {business.bankName && <>{business.bankName}<br /></>}
                {business.accountNumber && <>{d("sheet.account", { n: business.accountNumber })}<br /></>}
                {business.branchCode && <>{d("sheet.branch", { n: business.branchCode })}<br /></>}
                {d("sheet.reference", { n: doc.number })}
              </p>
            </div>
          )}
          <div>
            {doc.notes && <p className="whitespace-pre-line">{doc.notes}</p>}
            <p className="mt-2 text-paper-soft">{business.footerNote || d("sheet.thanks")}</p>
          </div>
        </footer>
      )}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline">{label}: </dt>
      <dd className="inline">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-paper-soft">
      <dt>{label}</dt>
      <dd className="text-paper-ink">{value}</dd>
    </div>
  );
}
