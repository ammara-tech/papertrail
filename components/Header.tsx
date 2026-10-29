"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NewDocumentButtons from "@/components/NewDocumentButtons";
import NavArrows from "@/components/NavArrows";
import SyncBadge from "@/components/SyncBadge";
import Logo from "@/components/Logo";
import { LangToggle, ThemeToggle } from "@/components/Toggles";
import { useT } from "@/components/LangProvider";
import { signOutUser } from "@/lib/auth";
import type { Key } from "@/lib/i18n";

/*
  The top bar on every page (hidden when printing).
  Laptops: the pages, back/forward/refresh, language, theme, saving status, account and New buttons.
  Phones and tablets: the name and the switches; the pages are in the bar at the bottom (PhoneNav).
*/

export const NAV: { href: string; key: Key; icon: "home" | "slips" | "people" | "cog" }[] = [
  { href: "/", key: "nav.overview", icon: "home" },
  { href: "/documents", key: "nav.documents", icon: "slips" },
  { href: "/customers", key: "nav.customers", icon: "people" },
  { href: "/settings", key: "nav.business", icon: "cog" },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/documents") return pathname.startsWith("/documents");
  return pathname.startsWith(href);
}

export default function Header({ email }: { email: string }) {
  const pathname = usePathname();
  const t = useT();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-sheet/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <NavArrows className="hidden lg:flex" />
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-carbon">
          <Logo />
          PaperTrail
        </Link>
        <nav aria-label={t("nav.main")} className="ml-2 hidden gap-1 lg:flex">
          {NAV.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[15px] transition-colors ${active ? "bg-carbon-soft font-semibold text-carbon" : "text-ink-soft hover:text-carbon"}`}
              >
                {t(l.key)}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <SyncBadge />
          <LangToggle />
          <ThemeToggle />
          <AccountMenu email={email} />
          <div className="ml-2 hidden shrink-0 xl:block">
            <NewDocumentButtons size="small" />
          </div>
        </div>
      </div>
    </header>
  );
}

function AccountMenu({ email }: { email: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("account.menu")}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-carbon font-bold text-on-carbon"
      >
        {(email[0] ?? "?").toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-64 rounded-xl border border-line bg-sheet p-2 shadow-lg">
          <p className="truncate px-3 py-2 text-sm text-ink-soft">{t("account.signedInAs", { email })}</p>
          <Link href="/settings" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-page">
            {t("nav.settings")}
          </Link>
          <button type="button" onClick={() => window.dispatchEvent(new Event("papertrail:shortcuts"))} className="block w-full rounded-md px-3 py-2 text-left hover:bg-page">
            {t("shortcuts.title")}
          </button>
          <button type="button" onClick={() => signOutUser()} className="block w-full rounded-md px-3 py-2 text-left text-overdue hover:bg-page">
            {t("account.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
