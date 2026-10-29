"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import { useAppData } from "@/lib/store";
import { useT } from "@/components/LangProvider";

/* One quote or invoice: /documents/<id>. Only its owner can open it (firestore.rules). */
export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const data = useAppData();
  const t = useT();
  if (!data) return null;

  const doc = data.documents.find((d) => d.id === id);
  if (!doc) {
    return (
      <div className="max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight">{t("editor.notFoundTitle")}</h1>
        <p className="mt-3 text-lg text-ink-soft">{t("editor.notFoundText")}</p>
        <Link href="/documents" className="mt-6 inline-block rounded-lg bg-carbon px-5 py-3 font-semibold text-on-carbon">
          {t("editor.backToDocuments")}
        </Link>
      </div>
    );
  }
  return <DocumentEditor key={doc.id} doc={doc} business={data.business} documents={data.documents} />;
}
