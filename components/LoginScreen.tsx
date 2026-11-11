"use client";

import { useEffect, useState, type FormEvent } from "react";
import { authErrorKey, errorCode, finishRedirectSignIn, resetPassword, signInDemo, signInEmail, signInGoogle, signUpEmail } from "@/lib/auth";
import { useT } from "@/components/LangProvider";
import { LangToggle, ThemeToggle } from "@/components/Toggles";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import type { Key } from "@/lib/i18n";
import { formatRand } from "@/lib/money";

/*
  Sign in or create an account, with email and password or with Google.
  The page is a tax invoice on a desk: what you get is listed as the invoice's lines (all R 0,00),
  and the sign-in form is filled in like a printed form. "Try the demo" is a yellow quote slip.
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
  // Opened from a "Try the demo" link (…/?demo): the demo box goes to the top
  const [fromDemoLink, setFromDemoLink] = useState(false);
  useEffect(() => {
    setFromDemoLink(new URLSearchParams(window.location.search).has("demo"));
  }, []);

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

  // "Try the demo" is a yellow quote slip, like the quotes inside the app
  const demoBox = (
    <div className="perforated rounded-b-xl border-x border-b border-quote-edge bg-quote px-5 pb-5 pt-6 text-slip-ink shadow-md">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-bold">{t("demo.title")}</p>
        <span className="font-type text-sm font-bold text-number">Nº DEMO</span>
      </div>
      <p className="mt-1 text-sm text-slip-soft">{t("demo.text")}</p>
      <button type="button" disabled={busy} onClick={() => run(signInDemo)} className="mt-3 w-full rounded-lg bg-carbon px-4 py-2.5 font-semibold text-on-carbon hover:opacity-90 disabled:opacity-60">
        {t("demo.button")}
      </button>
    </div>
  );

  const items = ["login.sheet.item1", "login.sheet.item2", "login.sheet.item3", "login.sheet.item4"] as const;

  return (
    <div className="desk min-h-screen">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <p className="font-display flex items-center gap-2 text-2xl font-semibold text-carbon">
          <Logo className="h-9 w-9" />
          PaperTrail
        </p>
        <div className="flex gap-1.5">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {fromDemoLink && <div className="mx-auto mb-8 max-w-md">{demoBox}</div>}

        {/* The sign-in page is a tax invoice on the desk: the form is filled in like one */}
        <article className="perforated rounded-b-2xl border-x border-b border-line bg-sheet shadow-[0_30px_60px_-30px_rgba(31,47,92,0.45)]">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-carbon px-6 pb-5 pt-8 sm:px-10">
            <div>
              <p className="font-display text-2xl font-semibold leading-tight text-carbon sm:text-4xl">{t("login.tagline")}</p>
              <p className="mt-2 hidden max-w-xl text-ink-soft sm:block">{t("login.pitch")}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">{t("sheet.taxInvoice")}</p>
              <p className="font-type text-2xl font-bold text-number">Nº 0001</p>
            </div>
          </header>

          <div className="grid gap-10 px-6 py-8 sm:px-10 md:grid-cols-[1fr_1.05fr]">
            {/* The form comes first for screen readers and on phones; on wider screens it's on the right */}
            <section>
              <h1 className="text-3xl font-semibold tracking-tight">{mode === "signIn" ? t("login.welcomeBack") : t("login.createTitle")}</h1>
              <p className="mt-2 text-ink-soft">{mode === "signIn" ? t("login.signInIntro") : t("login.createIntro")}</p>

              <button
                type="button"
                disabled={busy}
                onClick={() => run(signInGoogle)}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-sheet px-4 py-3 font-semibold hover:border-carbon disabled:opacity-60"
              >
                <Icon name="google" />
                {t("login.google")}
              </button>

              <p className="my-5 flex items-center gap-3 text-sm text-ink-soft before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">{t("login.or")}</p>

              <form onSubmit={submit} className="space-y-5">
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
                  {t("login.email")}
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="line-field normal-case tracking-normal" />
                </label>
                <div>
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">
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
                      className="line-field pr-20"
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

              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 text-[15px]">
                {mode === "signIn" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => (email.trim() ? run(() => resetPassword(email), "login.resetSent") : setMessage({ ok: false, key: "login.resetNeedsEmail" }))}
                    className="font-semibold text-carbon underline-offset-2 hover:underline"
                  >
                    {t("login.forgot")}
                  </button>
                )}
                <p className="text-ink-soft">
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
              </div>
            </section>

            {/* What you get, as the lines of the invoice */}
            <section aria-labelledby="what" className="md:order-first">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">{t("login.sheet.billTo")}</p>
              <p className="mt-1 text-lg font-semibold">{t("login.sheet.you")}</p>
              <h2 id="what" className="mt-6 border-b-2 border-line pb-2 text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
                {t("login.sheet.what")}
              </h2>
              <ul className="divide-y divide-line">
                {items.map((k) => (
                  <li key={k} className="flex items-baseline justify-between gap-4 py-3">
                    <span>{t(k)}</span>
                    <span className="shrink-0 font-type text-ink-soft">{formatRand(0)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t-2 border-carbon pt-3">
                <span className="font-bold">{t("sheet.total")}</span>
                <span className="font-display text-2xl font-semibold">{formatRand(0)}</span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="max-w-xs text-sm text-ink-soft">{t("login.privacy")}</p>
                <span aria-hidden="true" className="stamp shrink-0 text-lg text-paid">
                  {t("login.sheet.free")}
                </span>
              </div>
            </section>
          </div>
        </article>

        {!fromDemoLink && <div className="mx-auto mt-10 max-w-md">{demoBox}</div>}
      </main>
    </div>
  );
}

