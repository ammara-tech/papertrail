"use client";

import Link from "next/link";
import NewDocumentButtons from "@/components/NewDocumentButtons";
import SampleDocuments from "@/components/SampleDocuments";
import { useT } from "@/components/LangProvider";

/* The first visit: what to do first, next to samples of what you'll make */
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
      {/* Three real documents from the app (made-up details), overlapping, so a new user sees what they can make.
          Decorative: screen readers skip it, and phones skip it to keep the buttons near the top. */}
      <div aria-hidden="true" className="pointer-events-none relative mx-auto hidden h-[440px] w-full max-w-[560px] select-none overflow-hidden sm:block">
        <div className="absolute inset-4">
          <SampleDocuments />
        </div>
        {/* The pages fade into the background at the bottom, in light and dark */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-page to-transparent" />
      </div>
    </div>
  );
}
