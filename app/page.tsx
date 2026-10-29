"use client";

import Link from "next/link";
import { useAppData } from "@/lib/store";
import { balance, collectedByMonth, isOverdue, summary } from "@/lib/documents";
import { customers } from "@/lib/customers";
import { formatRand } from "@/lib/money";
import { MONTHS, formatDate, todayISO } from "@/lib/dates";
import { useLang, useT } from "@/components/LangProvider";
import Slip from "@/components/Slip";
import NewDocumentButtons from "@/components/NewDocumentButtons";
import SendButtons from "@/components/SendButtons";
import FirstRun from "@/components/FirstRun";

/*
  Overview: where the business stands today. Four tallies (collected, owed,
  overdue, open quotes), money received per month, the overdue invoices with
  reminder buttons, and the latest documents.
*/
export default function OverviewPage() {
  const data = useAppData();
  const t = useT();
  const lang = useLang();
  if (!data) return null;
  if (data.documents.length === 0) return <FirstRun noBusiness={!data.business.name.trim()} />;

  const today = todayISO();
  const s = summary(data.documents, today);
  const months = collectedByMonth(data.documents, today, 6);
  const top = Math.max(...months.map((m) => m.amount), 1);
  const overdue = data.documents.filter((d) => isOverdue(d, today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const latest = [...data.documents].sort((a, b) => (b.issueDate + b.createdAt).localeCompare(a.issueDate + a.createdAt)).slice(0, 3);
  const clientCount = customers(data.documents).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{data.business.name || t("nav.overview")}</h1>
          <p className="mt-2 text-lg text-ink-soft">{t("overview.today", { date: formatDate(today, lang) })}</p>
        </div>
        <div className="hidden lg:block xl:hidden">
          <NewDocumentButtons size="small" />
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <Tally label={t("overview.collected")} value={formatRand(s.collected)} note={t("overview.allTime")} />
        <Tally label={t("overview.owed")} value={formatRand(s.owed)} note={t("overview.onInvoices", { n: s.unpaidCount })} />
        <Tally label={t("overview.overdue")} value={formatRand(s.overdueAmount)} note={t("overview.onInvoices", { n: s.overdueCount })} alert={s.overdueCount > 0} />
        <Tally label={t("overview.openQuotes")} value={formatRand(s.openQuotesAmount)} note={t("overview.quotesWaiting", { n: s.openQuotesCount })} />
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="chart-title" className="rounded-xl border border-line bg-sheet p-5">
          <h2 id="chart-title" className="text-lg font-bold">
            {t("overview.chartTitle")}
          </h2>
          <p className="text-sm text-ink-soft">{t("overview.chartNote", { clients: clientCount, n: clientCount })}</p>
          {/* The bars are a picture; the same numbers are in the table below for screen readers */}
          <div aria-hidden="true" className="mt-6 flex h-52 items-end gap-3">
            {months.map((m) => {
              const [, mm] = m.month.split("-").map(Number);
              return (
                <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-xs font-semibold text-ink-soft">{m.amount > 0 ? formatRand(m.amount).replace(/,\d\d$/, "") : ""}</span>
                  <div className="w-full rounded-t-md bg-carbon" style={{ height: `${Math.max(2, (m.amount / top) * 100)}%`, opacity: m.amount > 0 ? 1 : 0.25 }} />
                  <span className="text-sm text-ink-soft">{MONTHS[lang][mm - 1]}</span>
                </div>
              );
            })}
          </div>
          <table className="sr-only">
            <caption>{t("overview.chartTitle")}</caption>
            <tbody>
              {months.map((m) => {
                const [y, mm] = m.month.split("-").map(Number);
                return (
                  <tr key={m.month}>
                    <th scope="row">{`${MONTHS[lang][mm - 1]} ${y}`}</th>
                    <td>{formatRand(m.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="attention-title">
          <h2 id="attention-title" className="text-lg font-bold">
            {t("overview.attention")}
          </h2>
          {overdue.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-line p-5 text-ink-soft">{t("overview.nothingOverdue")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {overdue.slice(0, 4).map((d) => (
                <li key={d.id} className="rounded-xl border border-invoice-edge bg-sheet p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/documents/${d.id}`} className="font-semibold text-carbon underline-offset-2 hover:underline">
                      {d.client.name || d.number}
                    </Link>
                    <span className="font-bold">{formatRand(balance(d))}</span>
                  </div>
                  <p className="text-sm text-overdue">{t("overview.dueOn", { n: d.number, date: formatDate(d.dueDate, lang) })}</p>
                  <div className="mt-3">
                    <SendButtons doc={d} business={data.business} kind="reminder" compact />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="latest-title" className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="latest-title" className="text-lg font-bold">
            {t("overview.latest")}
          </h2>
          <Link href="/documents" className="font-semibold text-carbon underline-offset-2 hover:underline">
            {t("overview.allDocuments", { n: data.documents.length })}
          </Link>
        </div>
        <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((d) => (
            <li key={d.id}>
              <Slip doc={d} today={today} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tally({ label, value, note, alert = false }: { label: string; value: string; note: string; alert?: boolean }) {
  return (
    <div className="bg-sheet p-5">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold tracking-tight ${alert ? "text-overdue" : ""}`}>{value}</dd>
      <dd className="text-sm text-ink-soft">{note}</dd>
    </div>
  );
}
