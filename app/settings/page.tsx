"use client";

import { useRef, useState } from "react";
import type { Business, Lang } from "@/lib/types";
import { getData, setData, useAppData } from "@/lib/store";
import { MAX_LOGO_CHARS, parseData } from "@/lib/storage";
import { todayISO } from "@/lib/dates";
import { signOutUser } from "@/lib/auth";
import { useT } from "@/components/LangProvider";
import type { Key } from "@/lib/i18n";

/*
  Business details: what goes at the top and bottom of every quote and invoice, the usual
  VAT and payment settings, and the language printed on documents. Saved as you type,
  to your account. Backup downloads everything as one file, and Restore brings it back.
*/
export default function SettingsPage() {
  const data = useAppData();
  const t = useT();
  const [message, setMessage] = useState<{ ok: boolean; key: Key; vars?: Record<string, string | number> } | null>(null);
  const restoreInput = useRef<HTMLInputElement>(null);

  if (!data) return null;
  const b = data.business;
  const change = (c: Partial<Business>) => setData((d) => ({ ...d, business: { ...d.business, ...c } }));
  const text = (label: Key, key: keyof Business, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm text-ink-soft">
      {t(label)}
      <input className="field" value={String(b[key])} onChange={(e) => change({ [key]: e.target.value } as Partial<Business>)} {...extra} />
    </label>
  );

  function addLogo(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setMessage({ ok: false, key: "settings.logoType" });
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      if (url.length > MAX_LOGO_CHARS) return setMessage({ ok: false, key: "settings.logoSize" });
      change({ logo: url });
      setMessage({ ok: true, key: "settings.logoAdded" });
    };
    reader.readAsDataURL(file);
  }

  function downloadBackup() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(getData(), null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `papertrail-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, key: "settings.backupDone" });
  }

  async function restoreBackup(file: File | undefined) {
    if (!file) return;
    const restored = parseData(await file.text());
    if (restoreInput.current) restoreInput.current.value = "";
    if (!restored.business.name && restored.documents.length === 0) return setMessage({ ok: false, key: "settings.restoreBad" });
    if (!window.confirm(t("settings.restoreConfirm", { n: restored.documents.length }))) return;
    setData(() => restored);
    setMessage({ ok: true, key: "settings.restoreDone", vars: { n: restored.documents.length } });
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("nav.settings")}</h1>
      <p className="mt-2 text-lg text-ink-soft">{t("settings.intro")}</p>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`mt-6 rounded-lg px-4 py-3 ${message.ok ? "bg-carbon-soft text-carbon" : "bg-invoice text-overdue"}`}>
          {t(message.key, message.vars)}
        </p>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-8">
        <fieldset className="rounded-xl border border-line bg-sheet p-5">
          <legend className="px-1 font-semibold">{t("settings.business")}</legend>
          {text("settings.name", "name", { autoComplete: "organization" })}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {text("settings.email", "email", { type: "email" })}
            {text("settings.phone", "phone", { type: "tel" })}
          </div>
          <label className="mt-3 block text-sm text-ink-soft">
            {t("settings.address")}
            <textarea className="field" rows={3} value={b.address} onChange={(e) => change({ address: e.target.value })} />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- a small data: URL */}
            {b.logo && <img src={b.logo} alt={t("settings.logoAlt")} className="h-14 max-w-40 rounded border border-line bg-white object-contain p-1" />}
            <label className="cursor-pointer rounded-lg border-2 border-dashed border-line px-4 py-2 font-semibold text-carbon hover:border-carbon focus-within:outline focus-within:outline-3 focus-within:outline-carbon">
              {b.logo ? t("settings.changeLogo") : t("settings.addLogo")}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => addLogo(e.target.files?.[0])} />
            </label>
            {b.logo && (
              <button type="button" onClick={() => change({ logo: "" })} className="text-sm text-overdue underline-offset-2 hover:underline">
                {t("settings.removeLogo")}
              </button>
            )}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-line bg-sheet p-5">
          <legend className="px-1 font-semibold">{t("settings.vatPayment")}</legend>
          {text("settings.vatNumber", "vatNumber", { inputMode: "numeric" })}
          <label className="mt-3 flex items-center gap-3 text-[15px]">
            <input type="checkbox" className="h-5 w-5 accent-carbon" checked={b.vatByDefault} onChange={(e) => change({ vatByDefault: e.target.checked })} />
            {t("settings.vatDefault")}
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="block text-sm text-ink-soft">
              {t("settings.terms")}
              <input className="field" type="number" min="0" max="365" value={b.paymentTermsDays} onChange={(e) => change({ paymentTermsDays: Math.min(365, Math.max(0, Number(e.target.value) || 0)) })} />
            </label>
            <label className="block text-sm text-ink-soft">
              {t("settings.validity")}
              <input className="field" type="number" min="0" max="365" value={b.quoteValidDays} onChange={(e) => change({ quoteValidDays: Math.min(365, Math.max(0, Number(e.target.value) || 0)) })} />
            </label>
            <label className="block text-sm text-ink-soft">
              {t("settings.docLanguage")}
              <select className="field" value={b.docLanguage} onChange={(e) => change({ docLanguage: e.target.value as Lang })}>
                <option value="en">English</option>
                <option value="af">Afrikaans</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-line bg-sheet p-5">
          <legend className="px-1 font-semibold">{t("settings.banking")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {text("settings.accountName", "accountName")}
            {text("settings.bank", "bankName", { placeholder: "Capitec, FNB, Standard Bank…" })}
            {text("settings.accountNumber", "accountNumber", { inputMode: "numeric" })}
            {text("settings.branch", "branchCode", { inputMode: "numeric" })}
          </div>
          <div className="mt-3">{text("settings.footer", "footerNote", { placeholder: t("sheet.thanks") })}</div>
        </fieldset>

        <fieldset className="rounded-xl border border-line bg-sheet p-5">
          <legend className="px-1 font-semibold">{t("settings.backup")}</legend>
          <p className="text-[15px] text-ink-soft">{t("settings.backupIntro")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={downloadBackup} className="rounded-lg bg-carbon px-4 py-2 font-semibold text-on-carbon hover:opacity-90">
              {t("settings.downloadBackup")}
            </button>
            <button type="button" onClick={() => restoreInput.current?.click()} className="rounded-lg border border-line bg-sheet px-4 py-2 hover:border-carbon">
              {t("settings.restore")}
            </button>
            <input ref={restoreInput} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => restoreBackup(e.target.files?.[0])} />
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-line bg-sheet p-5">
          <legend className="px-1 font-semibold">{t("settings.account")}</legend>
          <p className="text-[15px] text-ink-soft">{t("settings.accountIntro")}</p>
          <button type="button" onClick={() => signOutUser()} className="mt-4 rounded-lg border border-line px-4 py-2 font-semibold text-overdue hover:border-overdue">
            {t("account.signOut")}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
