"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";
import { NAV, isActive } from "@/components/Header";
import { useStartDocument } from "@/components/NewDocumentButtons";
import NavArrows from "@/components/NavArrows";
import { useT } from "@/components/LangProvider";

/*
  The bar at the bottom on phones: the four pages, with a big + in the middle for a
  new quote or invoice, and back/forward/refresh above it when you open the + menu.
  It stays clear of the iPhone home bar (safe-area inset).
*/
export default function PhoneNav() {
  const pathname = usePathname();
  const t = useT();
  const start = useStartDocument();
  const [open, setOpen] = useState(false);
  const [first, second, third, fourth] = NAV;

  const item = (l: (typeof NAV)[number]) => {
    const active = isActive(pathname, l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-semibold text-carbon" : "text-ink-soft"}`}
      >
        <Icon name={l.icon} className="h-6 w-6" />
        {t(l.key)}
      </Link>
    );
  };

  return (
    <nav aria-label={t("nav.main")} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-sheet/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden">
      {open && (
        <div className="absolute inset-x-3 bottom-full mb-3 rounded-2xl border border-line bg-sheet p-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => start("quote")} className="rounded-lg border-2 border-quote-edge bg-quote py-3 font-semibold text-slip-ink">
              {t("new.quote")}
            </button>
            <button type="button" onClick={() => start("invoice")} className="rounded-lg border-2 border-invoice-edge bg-invoice py-3 font-semibold text-slip-ink">
              {t("new.invoice")}
            </button>
          </div>
          <NavArrows className="mt-2 justify-center" />
        </div>
      )}
      <div className="flex items-end">
        {item(first)}
        {item(second)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? t("new.close") : t("new.menu")}
            className={`-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-carbon text-on-carbon shadow-lg transition-transform ${open ? "rotate-45" : ""}`}
          >
            <Icon name="plus" className="h-7 w-7" />
          </button>
        </div>
        {item(third)}
        {item(fourth)}
      </div>
    </nav>
  );
}
