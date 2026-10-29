"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/lib/store";
import { customers } from "@/lib/customers";
import { whatsappNumber } from "@/lib/messages";
import { formatRand } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { useLang, useT } from "@/components/LangProvider";
import NewDocumentButtons from "@/components/NewDocumentButtons";
import Icon from "@/components/Icon";

/*
  Customers: everyone you've quoted or invoiced, built from your documents.
  Who owes the most comes first. Each card links to that client's documents, can start
  a new quote or invoice with their details filled in, and opens WhatsApp or email.
*/
export default function CustomersPage() {
  const data = useAppData();
  const t = useT();
  const lang = useLang();
  const [query, setQuery] = useState("");
  const list = useMemo(() => (data ? customers(data.documents) : []), [data]);
  if (!data) return null;
  const shown = list.filter((c) => c.client.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("customers.title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("customers.intro")}</p>

      {list.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-line p-6 text-ink-soft">{t("customers.empty")}</p>
      ) : (
        <>
          <label className="mt-8 block max-w-xs">
            <span className="sr-only">{t("customers.search")}</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("customers.search")} className="field" />
          </label>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {shown.map((c) => {
              const wa = whatsappNumber(c.client.phone);
              return (
                <li key={c.key} className="rounded-xl border border-line bg-sheet p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">{c.client.name}</h2>
                      <p className="text-sm text-ink-soft">
                        {t("customers.documents", { n: c.documents })}, {t("customers.last", { date: formatDate(c.lastDate, lang) })}
                      </p>
                    </div>
                    {c.owed > 0 ? (
                      <p className="text-right">
                        <span className="block text-sm text-ink-soft">{t("customers.owes")}</span>
                        <span className="text-xl font-bold text-overdue">{formatRand(c.owed)}</span>
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-paid">{c.billed > 0 ? t("customers.allPaid") : t("customers.quotesOnly")}</p>
                    )}
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-ink-soft">{t("customers.billed")}</dt>
                      <dd className="font-semibold">{formatRand(c.billed)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-soft">{t("customers.paid")}</dt>
                      <dd className="font-semibold">{formatRand(c.paid)}</dd>
                    </div>
                  </dl>
                  {(c.client.phone || c.client.email) && (
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {c.client.phone && (
                        <a href={wa ? `https://wa.me/${wa}` : `tel:${c.client.phone.replace(/\s/g, "")}`} target={wa ? "_blank" : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-carbon underline-offset-2 hover:underline">
                          <Icon name={wa ? "whatsapp" : "people"} className="h-4 w-4" />
                          {c.client.phone}
                        </a>
                      )}
                      {c.client.email && (
                        <a href={`mailto:${c.client.email}`} className="inline-flex items-center gap-1.5 text-carbon underline-offset-2 hover:underline">
                          <Icon name="mail" className="h-4 w-4" />
                          {c.client.email}
                        </a>
                      )}
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                    <Link href={`/documents?client=${encodeURIComponent(c.client.name)}`} className="font-semibold text-carbon underline-offset-2 hover:underline">
                      {t("customers.seeDocuments")}
                    </Link>
                    <div className="ml-auto">
                      <NewDocumentButtons size="small" client={c.client} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
