"use client";

import Link from "next/link";
import { useT } from "@/components/LangProvider";

export default function NotFound() {
  const t = useT();
  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold tracking-tight">{t("notFound.title")}</h1>
      <p className="mt-3 text-lg text-ink-soft">{t("notFound.text")}</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-carbon px-5 py-3 font-semibold text-on-carbon">
        {t("notFound.home")}
      </Link>
    </div>
  );
}
