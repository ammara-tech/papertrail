"use client";

import { useState } from "react";
import { useT } from "@/components/LangProvider";
import { endDemo } from "@/lib/demo";

/*
  The strip at the top while someone is trying the demo (signed in as a guest, lib/demo.ts).
  "End the demo" deletes the made-up business and the guest account, which takes them back to
  the sign-in screen, where they can make a real account. In English or Afrikaans, like the app.
*/
export default function DemoBanner() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function end() {
    setBusy(true);
    setError(false);
    try {
      await endDemo();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-carbon/30 bg-carbon-soft print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm">
        <p className="flex-1">
          {t("demo.banner")}
          {error && <span className="ml-1 font-semibold text-overdue">{t("demo.endFailed")}</span>}
        </p>
        <button type="button" onClick={end} disabled={busy} className="rounded-lg bg-carbon px-4 py-1.5 font-semibold text-on-carbon hover:opacity-90 disabled:opacity-60">
          {busy ? t("demo.ending") : t("demo.end")}
        </button>
      </div>
    </div>
  );
}
