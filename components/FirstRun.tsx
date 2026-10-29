"use client";

import Link from "next/link";
import NewDocumentButtons from "@/components/NewDocumentButtons";
import { useT } from "@/components/LangProvider";

/* The first visit: an empty duplicate book, and what to do first */
export default function FirstRun({ noBusiness }: { noBusiness: boolean }) {
  const t = useT();
  return (
    <div className="grid items-center gap-12 py-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{t("first.title")}</h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft">{t("first.intro")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {noBusiness && (
            <>
              <Link href="/settings" className="rounded-lg bg-carbon px-5 py-3 font-semibold text-on-carbon hover:opacity-90">
                {t("first.business")}
              </Link>
              <span className="text-ink-soft">{t("first.or")}</span>
            </>
          )}
          <NewDocumentButtons />
        </div>
      </div>
      <div aria-hidden="true" className="relative mx-auto h-72 w-full max-w-sm">
        <div className="perforated absolute left-16 right-0 top-0 h-60 rotate-[8deg] rounded-b-lg border-x border-b border-quote-edge bg-quote" />
        <div className="perforated absolute left-0 right-14 top-4 h-60 -rotate-[6deg] rounded-b-lg border-x border-b border-invoice-edge bg-invoice" />
        <div className="perforated absolute inset-x-6 top-12 h-60 rounded-b-lg bg-paper p-6 shadow-[0_12px_32px_-12px_rgba(30,58,138,0.3)]">
          <div className="flex justify-between">
            <span className="h-3 w-24 rounded bg-[#dbe4f7]" />
            <span className="font-type text-lg font-bold text-[#b4122b]">No. 0001</span>
          </div>
          <div className="mt-8 space-y-3">
            <span className="block h-2.5 w-full rounded bg-[#eef2f9]" />
            <span className="block h-2.5 w-5/6 rounded bg-[#eef2f9]" />
            <span className="block h-2.5 w-2/3 rounded bg-[#eef2f9]" />
          </div>
          <div className="mt-10 flex justify-end">
            <span className="h-4 w-28 rounded bg-[#dbe4f7]" />
          </div>
        </div>
      </div>
    </div>
  );
}
