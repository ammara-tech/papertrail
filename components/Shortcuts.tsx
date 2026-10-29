"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStartDocument } from "@/components/NewDocumentButtons";
import { setLang, useLang, useT } from "@/components/LangProvider";
import { toggleTheme } from "@/components/Toggles";
import type { Key } from "@/lib/i18n";

/*
  Keyboard shortcuts, like my clinic dashboard's. Single keys, ignored while typing in a box:
  N new invoice, Q new quote, / search documents, T theme, L language, ? this list,
  and G then O, D, C or S to go to Overview, Documents, Customers or Business details.
*/

const LIST: [string, Key][] = [
  ["N", "shortcuts.newInvoice"],
  ["Q", "shortcuts.newQuote"],
  ["/", "shortcuts.search"],
  ["G O", "shortcuts.overview"],
  ["G D", "shortcuts.documents"],
  ["G C", "shortcuts.customers"],
  ["G S", "shortcuts.settings"],
  ["T", "shortcuts.theme"],
  ["L", "shortcuts.language"],
  ["?", "shortcuts.help"],
];

export function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

export default function Shortcuts() {
  const t = useT();
  const lang = useLang();
  const router = useRouter();
  const start = useStartDocument();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let goPressedAt = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      if (Date.now() - goPressedAt < 1500) {
        const pages: Record<string, string> = { o: "/", d: "/documents", c: "/customers", s: "/settings" };
        const to = pages[k];
        goPressedAt = 0;
        if (to) {
          e.preventDefault();
          router.push(to);
        }
        return;
      }
      if (k === "g") goPressedAt = Date.now();
      else if (k === "n") start("invoice");
      else if (k === "q") start("quote");
      else if (k === "t") toggleTheme();
      else if (k === "l") setLang(lang === "en" ? "af" : "en");
      else if (e.key === "?") dialog.current?.showModal();
      else if (k === "/") {
        e.preventDefault();
        if (location.pathname !== "/documents") router.push("/documents?search=1");
        else window.dispatchEvent(new Event("papertrail:search"));
      }
    };
    const open = () => dialog.current?.showModal();
    window.addEventListener("keydown", onKey);
    window.addEventListener("papertrail:shortcuts", open);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("papertrail:shortcuts", open);
    };
  }, [router, start, lang]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="shortcuts-title"
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-2xl border border-line bg-sheet p-6 text-ink backdrop:bg-ink/40"
    >
      <h2 id="shortcuts-title" className="text-xl font-bold">
        {t("shortcuts.title")}
      </h2>
      <dl className="mt-4 space-y-2">
        {LIST.map(([keys, key]) => (
          <div key={keys} className="flex items-center justify-between gap-4">
            <dt className="text-ink-soft">{t(key)}</dt>
            <dd className="flex gap-1">
              {keys.split(" ").map((k) => (
                <kbd key={k} className="min-w-7 rounded border border-line bg-page px-1.5 py-0.5 text-center text-sm font-semibold">
                  {k}
                </kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <form method="dialog" className="mt-6">
        <button className="w-full rounded-lg bg-carbon py-2 font-semibold text-on-carbon">{t("common.close")}</button>
      </form>
    </dialog>
  );
}
