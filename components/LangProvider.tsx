"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/types";
import { translate, type Key } from "@/lib/i18n";

/*
  The app's language (English or Afrikaans), remembered on this device.
  useT() gives components a t() function that returns the text in the chosen language.
  The language printed on quotes and invoices is a separate setting (Business details),
  because a business may use the app in Afrikaans but bill English-speaking clients.
*/

const STORAGE_KEY = "papertrail:lang";
const listeners = new Set<() => void>();

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "af") return saved;
  } catch {
    /* storage blocked */
  }
  return typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("af") ? "af" : "en";
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* it still changes for this visit */
  }
  current = lang;
  listeners.forEach((l) => l());
}

let current: Lang | null = null;
const getLang = () => (current ??= readLang());

type Ctx = { lang: Lang; t: (key: Key, vars?: Record<string, string | number>) => string };
const LangContext = createContext<Ctx>({ lang: "en", t: (key, vars) => translate("en", key, vars) });

export default function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getLang,
    () => "en" as Lang,
  );
  useEffect(() => {
    document.documentElement.lang = lang === "af" ? "af-ZA" : "en-ZA";
  }, [lang]);
  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  const value = useMemo(() => ({ lang, t }), [lang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useT = () => useContext(LangContext).t;
export const useLang = () => useContext(LangContext).lang;
