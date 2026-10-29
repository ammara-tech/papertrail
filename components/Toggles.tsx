"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { setLang, useLang, useT } from "@/components/LangProvider";

/*
  Light/dark switch and the English/Afrikaans switch, in the header on every page.
  The theme is remembered on this device; a small script in app/layout.tsx applies
  it before the page is drawn, so there's no white flash in dark mode.
*/

export const THEME_KEY = "papertrail:theme";

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* it still changes for this visit */
  }
  window.dispatchEvent(new Event("papertrail:theme"));
}

export function ThemeToggle() {
  const t = useT();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === "dark");
    read();
    window.addEventListener("papertrail:theme", read);
    return () => window.removeEventListener("papertrail:theme", read);
  }, []);
  return (
    <button type="button" onClick={toggleTheme} aria-label={dark ? t("theme.toLight") : t("theme.toDark")} title={dark ? t("theme.toLight") : t("theme.toDark")} className="tool">
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}

export function LangToggle() {
  const t = useT();
  const lang = useLang();
  const next = lang === "en" ? "af" : "en";
  return (
    <button type="button" onClick={() => setLang(next)} aria-label={t("lang.switch")} title={t("lang.switch")} className="tool px-2.5 text-xs font-bold">
      {next.toUpperCase()}
    </button>
  );
}
