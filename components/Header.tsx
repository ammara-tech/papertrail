"use client";

import Link from "next/link";
import { endDemo } from "@/lib/demo";
import { firebase } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NewDocumentButtons from "@/components/NewDocumentButtons";
import NavArrows from "@/components/NavArrows";
import SyncBadge from "@/components/SyncBadge";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import { LangToggle, ThemeToggle } from "@/components/Toggles";
import { useT } from "@/components/LangProvider";
import { signOutUser } from "@/lib/auth";
import type { Key } from "@/lib/i18n";

/*
  The navigation, laid out like accounting software (hidden when printing).
  Laptops: a sidebar down the left with the pages, New quote and New invoice, and at the
  bottom the saving status, language, theme and your account.
  Phones and tablets: a slim bar at the top with the name and the switches; the pages are in
  the bar at the bottom (PhoneNav).
*/

export const NAV: { href: string; key: Key; icon: "home" | "slips" | "people" | "receipt" | "box" | "cog" }[] = [
  { href: "/", key: "nav.overview", icon: "home" },
  { href: "/documents", key: "nav.documents", icon: "slips" },
  { href: "/customers", key: "nav.customers", icon: "people" },
  { href: "/expenses", key: "nav.expenses", icon: "receipt" },
  { href: "/stock", key: "nav.stock", icon: "box" },
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
    <>
      {/* Laptops: the sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-sheet lg:flex print:hidden">
        <Link href="/" className="font-display flex items-center gap-2.5 px-6 pb-2 pt-6 text-2xl font-semibold tracking-tight text-carbon">
          <Logo className="h-9 w-9" />
          PaperTrail
        </Link>
        <p className="px-6 font-type text-xs text-number">{t("login.sheet.ledger")}</p>
        <div className="mt-6 px-4">
          <NewDocumentButtons size="small" />
        </div>
        <nav aria-label={t("nav.main")} className="mt-6 flex-1 overflow-y-auto px-3">
          <ul className="space-y-1">
            {NAV.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-[15px] transition-colors ${active ? "border-number bg-carbon-soft font-semibold text-carbon" : "border-transparent text-ink-soft hover:bg-page hover:text-carbon"}`}
                  >
                    <Icon name={l.icon} className="h-5 w-5" />
                    {t(l.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-4">
          <NavArrows className="mb-3" />
          <div className="flex items-center gap-1.5">
            <SyncBadge />
            <LangToggle />
            <ThemeToggle />
            <div className="ml-auto">
              <AccountMenu email={email} up />
            </div>
          </div>
        </div>
      </aside>

      {/* Phones and tablets: a slim bar at the top */}
      <header className="sticky top-0 z-30 border-b border-line bg-sheet/90 backdrop-blur lg:hidden print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" className="font-display flex shrink-0 items-center gap-2 text-xl font-semibold tracking-tight text-carbon">
            <Logo />
            PaperTrail
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <SyncBadge />
            <LangToggle />
            <ThemeToggle />
            <AccountMenu email={email} />
          </div>
        </div>
      </header>
    </>
  );
}

function AccountMenu({ email, up = false }: { email: string; up?: boolean }) {
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
        <div className={`absolute right-0 z-40 w-64 rounded-xl border border-line bg-sheet p-2 shadow-lg ${up ? "bottom-11" : "top-11"}`}>
          <p className="truncate px-3 py-2 text-sm text-ink-soft">{t("account.signedInAs", { email })}</p>
          {/* Stock isn't in the phone's bottom bar (it has room for four pages), so it's here on phones */}
          <Link href="/stock" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-page lg:hidden">
            {t("nav.stock")}
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 hover:bg-page">
            {t("nav.settings")}
          </Link>
          <button type="button" onClick={() => window.dispatchEvent(new Event("papertrail:shortcuts"))} className="block w-full rounded-md px-3 py-2 text-left hover:bg-page">
            {t("shortcuts.title")}
          </button>
          <button type="button" onClick={() => (firebase().auth.currentUser?.isAnonymous ? endDemo() : signOutUser())} className="block w-full rounded-md px-3 py-2 text-left text-overdue hover:bg-page">
            {t("account.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
