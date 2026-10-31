"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authErrorKey, errorCode, finishRedirectSignIn, resetPassword, signInEmail, signInGoogle, signUpEmail } from "@/lib/auth";
import { useLang, useT } from "@/components/LangProvider";
import { LangToggle, ThemeToggle } from "@/components/Toggles";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import type { Key } from "@/lib/i18n";
import { formatRand } from "@/lib/money";
import { formatDate } from "@/lib/dates";

/*
  Sign in or create an account, with email and password or with Google.
  Firebase checks the password and limits repeated wrong guesses; this screen only
  shows the result in plain words. "Forgot your password?" sends Firebase's reset email.
*/
export default function LoginScreen() {
  const t = useT();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; key: Key; code?: string } | null>(null);

  // If Google sign-in went the full-page way and failed, say why when the page comes back.
  useEffect(() => {
    finishRedirectSignIn().catch((e) => {
      setMessage({ ok: false, key: authErrorKey(e) as Key, code: errorCode(e) });
      console.error("Sign-in failed:", errorCode(e) || e);
    });
  }, []);

  async function run(action: () => Promise<unknown>, okKey?: Key) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (okKey) setMessage({ ok: true, key: okKey });
    } catch (e) {
      setMessage({ ok: false, key: authErrorKey(e) as Key, code: errorCode(e) });
      console.error("Sign-in failed:", errorCode(e) || e); // the code, for whoever is fixing it
    }
    setBusy(false);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowPassword(false);
    run(() => (mode === "signIn" ? signInEmail(email, password) : signUpEmail(email, password)));
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#1e3a8a] p-12 text-white lg:flex lg:flex-col">
        <p className="relative flex items-center gap-2 text-2xl font-bold">
          <Logo className="h-9 w-9" />
          PaperTrail
        </p>
        <DemoDocs />
        <h1 className="relative mt-auto max-w-md text-5xl font-bold leading-[1.05] tracking-tight">{t("login.tagline")}</h1>
        <p className="relative mt-5 max-w-md text-lg text-white/85">{t("login.pitch")}</p>
      </aside>

      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xl font-bold text-carbon lg:invisible">
            <Logo />
            PaperTrail
          </p>
          <div className="flex gap-1.5">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="m-auto w-full max-w-sm py-10">
          <h2 className="text-3xl font-bold tracking-tight">{mode === "signIn" ? t("login.welcomeBack") : t("login.createTitle")}</h2>
          <p className="mt-2 text-ink-soft">{mode === "signIn" ? t("login.signInIntro") : t("login.createIntro")}</p>

          <button
            type="button"
            disabled={busy}
            onClick={() => run(signInGoogle)}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-sheet px-4 py-3 font-semibold hover:border-carbon disabled:opacity-60"
          >
            <Icon name="google" />
            {t("login.google")}
          </button>

          <p className="my-6 flex items-center gap-3 text-sm text-ink-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">{t("login.or")}</p>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm text-ink-soft">
              {t("login.email")}
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
            </label>
            <div>
              <label htmlFor="password" className="text-sm text-ink-soft">
                {t("login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "signUp" ? 8 : undefined}
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="absolute inset-y-0 right-0 mt-1 px-3 text-sm font-semibold text-carbon"
                >
                  {showPassword ? t("login.hide") : t("login.show")}
                  <span className="sr-only"> {t("login.password")}</span>
                </button>
              </div>
              {mode === "signUp" && <p className="mt-1 text-sm text-ink-soft">{t("login.passwordHint")}</p>}
            </div>

            {message && (
              <p role={message.ok ? "status" : "alert"} className={`rounded-lg px-4 py-3 text-sm ${message.ok ? "bg-carbon-soft text-carbon" : "bg-invoice text-overdue"}`}>
                {t(message.key)}
                {message.code && <span className="mt-1 block text-xs opacity-75">{t("login.errorCode", { code: message.code })}</span>}
              </p>
            )}

            <button type="submit" disabled={busy} className="w-full rounded-lg bg-carbon px-4 py-3 font-semibold text-on-carbon hover:opacity-90 disabled:opacity-60">
              {busy ? t("login.working") : mode === "signIn" ? t("login.signIn") : t("login.create")}
            </button>
          </form>

          {mode === "signIn" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => (email.trim() ? run(() => resetPassword(email), "login.resetSent") : setMessage({ ok: false, key: "login.resetNeedsEmail" }))}
              className="mt-4 text-sm font-semibold text-carbon underline-offset-2 hover:underline"
            >
              {t("login.forgot")}
            </button>
          )}

          <p className="mt-8 text-[15px] text-ink-soft">
            {mode === "signIn" ? t("login.noAccount") : t("login.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setMessage(null);
              }}
              className="font-semibold text-carbon underline-offset-2 hover:underline"
            >
              {mode === "signIn" ? t("login.toCreate") : t("login.toSignIn")}
            </button>
          </p>
          <p className="mt-6 text-sm text-ink-soft">{t("login.privacy")}</p>
        </div>
      </main>
    </div>
  );
}

/*
  Three example cards on the carbon-blue side (laptops only), so people see what PaperTrail
  does before they sign up: a quote the client accepted, the tax invoice made from it with
  15% VAT and a part payment, and the WhatsApp reminder for what's still owed.
  Made-up details. Decorative only: hidden from screen readers.
*/
const SUBTOTAL = 252500; // R2 525,00 in cents: geyser element R1 850 + 1.5 hours at R450
const VAT = 37875; // 15%
const TOTAL = SUBTOTAL + VAT;
const PAID = 100000;

function DemoDocs() {
  const t = useT();
  const lang = useLang();
  const shadow = "shadow-[0_24px_50px_-18px_rgba(0,0,0,0.6)]";
  const row = "flex justify-between gap-3";
  return (
    // The cards are laid out on a 540 × 440 board, shown at 80% on smaller laptops so they always fit.
    // --color-page makes the holes in the perforated edges match the blue panel.
    <div aria-hidden="true" className="relative mx-auto mb-10 mt-8 h-[352px] w-[432px] shrink-0 select-none 2xl:h-[440px] 2xl:w-[540px]">
      <div style={{ ["--color-page" as string]: "#1e3a8a" }} className="absolute left-0 top-0 h-[440px] w-[540px] origin-top-left scale-[0.8] text-slip-ink 2xl:scale-100">
      {/* The quote, accepted */}
      <div className={`perforated absolute left-1 top-2 w-[240px] rotate-[-4deg] rounded-b-lg border-x border-b border-quote-edge bg-quote px-4 pb-4 pt-5 ${shadow}`}>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slip-soft">{t("doc.quote")}</span>
          <span className="font-type font-bold text-number">{t("slip.no", { n: "0038" })}</span>
        </div>
        <p className="mt-2 font-semibold">Lerato Dlamini</p>
        <p className="text-xs text-slip-soft">{t("slip.validUntil", { date: formatDate("2026-11-05", lang) })}</p>
        <ul className="mt-3 space-y-1 border-t border-quote-edge pt-2 text-xs">
          <li className={row}>
            <span className="truncate">Geyser element</span>
            <span className="shrink-0">{formatRand(185000)}</span>
          </li>
          <li className={row}>
            <span>Labour, 1.5 h</span>
            <span>{formatRand(67500)}</span>
          </li>
        </ul>
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="text-lg font-bold tracking-tight">{formatRand(TOTAL)}</p>
          <span className="stamp shrink-0 whitespace-nowrap text-[10px] text-carbon">{t("stamp.accepted")}</span>
        </div>
      </div>

      {/* The tax invoice made from it: VAT worked out, part paid */}
      <div className={`perforated absolute right-1 top-[22px] w-[248px] rotate-[3deg] rounded-b-lg border-x border-b border-invoice-edge bg-invoice px-4 pb-4 pt-5 ${shadow}`}>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slip-soft">{t("sheet.taxInvoice")}</span>
          <span className="font-type font-bold text-number">{t("slip.no", { n: "0042" })}</span>
        </div>
        <p className="mt-2 font-semibold">Lerato Dlamini</p>
        <dl className="mt-3 space-y-1 border-t border-invoice-edge pt-2 text-xs">
          <div className={row}>
            <dt>{t("sheet.subtotal")}</dt>
            <dd>{formatRand(SUBTOTAL)}</dd>
          </div>
          <div className={row}>
            <dt>{t("sheet.vat", { pct: 15 })}</dt>
            <dd>{formatRand(VAT)}</dd>
          </div>
          <div className={`${row} font-semibold`}>
            <dt>{t("sheet.total")}</dt>
            <dd>{formatRand(TOTAL)}</dd>
          </div>
          <div className={row}>
            <dt>{t("sheet.paid")}</dt>
            <dd>−{formatRand(PAID)}</dd>
          </div>
        </dl>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-slip-soft">{t("sheet.balanceDue")}</p>
            <p className="text-lg font-bold tracking-tight">{formatRand(TOTAL - PAID)}</p>
          </div>
          <span className="stamp shrink-0 whitespace-nowrap text-[10px] text-partpaid">{t("stamp.partPaid")}</span>
        </div>
      </div>

      {/* The reminder, sent on WhatsApp (fixed colours, so it looks like a chat in light and dark mode) */}
      <div className={`absolute bottom-1 left-2 w-[258px] rotate-[2deg] rounded-xl bg-[#efe7dc] p-3 text-[#1f2328] ${shadow}`}>
        <p className="flex items-center gap-2 text-xs font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25d366] text-white">
            <Icon name="whatsapp" className="h-3.5 w-3.5" />
          </span>
          Lerato Dlamini
        </p>
        <div className="ml-auto mt-2 w-[92%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 py-2 text-[11px] leading-snug">
          {t("login.demo.reminder", { name: "Lerato", n: "INV-0042", amount: formatRand(TOTAL - PAID), date: formatDate("2026-11-28", lang) })}
          <p className="mt-1.5 flex items-center justify-between gap-2">
            <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-[#b42318]">INV-0042.pdf</span>
            <span className="text-[10px] text-[#0b6b9e]">09:14 ✓✓</span>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
