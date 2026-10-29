"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/store";
import { balance, invoiceState, matches, paidAmount, summary } from "@/lib/documents";
import { customerKey } from "@/lib/customers";
import { totals } from "@/lib/totals";
import { centsToInput, formatRand } from "@/lib/money";
import { todayISO } from "@/lib/dates";
import { toCsv } from "@/lib/csv";
import { useT } from "@/components/LangProvider";
import Slip from "@/components/Slip";
import FirstRun from "@/components/FirstRun";
import Icon from "@/components/Icon";

/*
  Documents: every quote and invoice as a slip, newest first, with one sentence at
  the top saying what's owed. Filter by type, search by client or number, or open it
  from the Customers page to see one client's documents (?client=...).
  Download CSV saves the list you're looking at for Excel or Google Sheets.
*/

type Show = "all" | "quote" | "invoice";

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <Documents />
    </Suspense>
  );
}

function Documents() {
  const data = useAppData();
  const t = useT();
  const params = useSearchParams();
  const client = params.get("client") ?? "";
  const [show, setShow] = useState<Show>("all");
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const today = todayISO();

  // The / shortcut (components/Shortcuts.tsx) jumps to the search box
  useEffect(() => {
    if (params.get("search")) search.current?.focus();
    const focus = () => search.current?.focus();
    window.addEventListener("papertrail:search", focus);
    return () => window.removeEventListener("papertrail:search", focus);
  }, [params]);

  const docs = useMemo(
    () =>
      (data?.documents ?? [])
        .filter((d) => (show === "all" || d.type === show) && matches(d, query) && (!client || customerKey(d.client.name) === customerKey(client)))
        .sort((a, b) => (b.issueDate + b.createdAt).localeCompare(a.issueDate + a.createdAt)),
    [data, show, query, client],
  );

  if (!data) return null;
  if (data.documents.length === 0) return <FirstRun noBusiness={!data.business.name.trim()} />;
  const s = summary(data.documents, today);

  function downloadCsv() {
    const rows = [
      [t("csv.number"), t("csv.type"), t("csv.date"), t("csv.due"), t("csv.client"), t("csv.email"), t("csv.total"), t("csv.paid"), t("csv.balance"), t("csv.status")],
      ...docs.map((d) => [
        d.number,
        d.type === "quote" ? t("doc.quote") : t("doc.invoice"),
        d.issueDate,
        d.dueDate,
        d.client.name,
        d.client.email,
        centsToInput(totals(d).total),
        d.type === "invoice" ? centsToInput(paidAmount(d)) : "",
        d.type === "invoice" ? centsToInput(balance(d)) : "",
        d.type === "quote" ? t(`quote.${d.quoteStatus}`) : t(`invoice.${invoiceState(d)}`),
      ]),
    ];
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `papertrail-documents-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {s.unpaidCount === 0 ? (
          t("documents.allPaid")
        ) : (
          <>
            {t("documents.waiting", { amount: formatRand(s.owed), n: s.unpaidCount })}
            {s.overdueCount > 0 && <span className="text-overdue"> {t("documents.overdue", { n: s.overdueCount })}</span>}
          </>
        )}
      </h1>
      {s.openQuotesCount > 0 && <p className="mt-3 text-lg text-ink-soft">{t("documents.openQuotes", { n: s.openQuotesCount, amount: formatRand(s.openQuotesAmount) })}</p>}

      {client && (
        <p className="mt-6 flex flex-wrap items-center gap-3 rounded-lg bg-carbon-soft px-4 py-2 text-carbon">
          {t("documents.forClient", { name: client })}
          <Link href="/documents" className="font-semibold underline underline-offset-2">
            {t("documents.showAll")}
          </Link>
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div role="group" aria-label={t("documents.show")} className="flex rounded-lg border border-line bg-sheet p-1">
          {(["all", "quote", "invoice"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={show === value}
              onClick={() => setShow(value)}
              className={`rounded-md px-3 py-1.5 text-sm ${show === value ? "bg-carbon font-semibold text-on-carbon" : "text-ink-soft hover:text-carbon"}`}
            >
              {t(`documents.filter.${value}`)}
            </button>
          ))}
        </div>
        <label className="relative w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1">
          <span className="sr-only">{t("documents.search")}</span>
          <input ref={search} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("documents.search")} className="field mt-0" />
        </label>
        <button type="button" onClick={downloadCsv} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-line bg-sheet px-3 py-2 text-sm font-semibold hover:border-carbon">
          <Icon name="download" className="h-4 w-4" />
          {t("documents.csv")}
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="mt-10 text-ink-soft">{query.trim() ? t("documents.noMatch", { q: query.trim() }) : t("documents.noneHere")}</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <li key={d.id}>
              <Slip doc={d} today={today} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
