"use client";

import { useRouter } from "next/navigation";
import { getData, setData } from "@/lib/store";
import { createDocument, updateDocument } from "@/lib/documents";
import { todayISO } from "@/lib/dates";
import type { Client, DocType } from "@/lib/types";
import { useT } from "@/components/LangProvider";

/* Makes a new quote or invoice (optionally for a client you already have), then opens it */
export function useStartDocument() {
  const router = useRouter();
  return (type: DocType, client?: Client) => {
    const data = getData();
    if (!data) return;
    const made = createDocument(data, type, todayISO());
    setData(() => (client ? updateDocument(made.data, made.doc.id, { client: { ...client } }) : made.data));
    router.push(`/documents/${made.doc.id}`);
  };
}

/* "New quote" (yellow) and "New invoice" (pink) */
export default function NewDocumentButtons({ size = "large", client }: { size?: "small" | "large"; client?: Client }) {
  const t = useT();
  const start = useStartDocument();
  const base = size === "small" ? "rounded-md border px-3 py-1.5 text-sm font-semibold" : "rounded-lg border-2 px-5 py-3 text-base font-semibold";
  return (
    <div className={`flex gap-2 ${size === "small" ? "flex-nowrap" : "flex-wrap"}`}>
      <button type="button" onClick={() => start("quote", client)} className={`${base} border-quote-edge bg-quote text-slip-ink hover:brightness-95`}>
        {t("new.quote")}
      </button>
      <button type="button" onClick={() => start("invoice", client)} className={`${base} border-invoice-edge bg-invoice text-slip-ink hover:brightness-95`}>
        {t("new.invoice")}
      </button>
    </div>
  );
}
