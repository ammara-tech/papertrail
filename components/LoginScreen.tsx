"use client";

import { useState, type FormEvent } from "react";
import { authErrorKey, resetPassword, signInEmail, signInGoogle, signUpEmail } from "@/lib/auth";
import { useT } from "@/components/LangProvider";
import { LangToggle, ThemeToggle } from "@/components/Toggles";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import type { Key } from "@/lib/i18n";

/*
  Sign in or create an account, with email and password or with Google.
  Firebase checks the password and limits repeated wrong guesses; this screen only
  shows the result in plain words. "Forgot your password?" sends Firebase's reset email.
*/
/* Who took the photo, e.g. "Photo: Thabo Mokoena on Unsplash". Leave empty to hide the line. */
const PHOTO_CREDIT = "";

export default function LoginScreen() {
  const t = useT();
  const [photoOk, setPhotoOk] = useState(true);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; key: Key } | null>(null);

  async function run(action: () => Promise<unknown>, okKey?: Key) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      if (okKey) setMessage({ ok: true, key: okKey });
    } catch (e) {
      setMessage({ ok: false, key: authErrorKey(e) as Key });
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
        {/* The photo: public/login-photo.jpg. If it's missing, the plain carbon-blue panel shows instead. */}
        {photoOk && (
          // eslint-disable-next-line @next/next/no-img-element -- a decorative background photo
          <img src="/login-photo.jpg" alt="" onError={() => setPhotoOk(false)} className="absolute inset-0 h-full w-full object-cover" />
        )}
        {/* Dark fades at the top and bottom keep the logo and the white text readable on the photo */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 via-45% to-black/0" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        <p className="relative flex items-center gap-2 text-2xl font-bold">
          <Logo className="h-9 w-9" />
          PaperTrail
        </p>
        <h1 className="relative mt-auto max-w-md text-5xl font-bold leading-[1.05] tracking-tight">{t("login.tagline")}</h1>
        <p className="relative mt-5 max-w-md text-lg text-white/85">{t("login.pitch")}</p>
        {PHOTO_CREDIT && <p className="relative mt-8 text-xs text-white/60">{PHOTO_CREDIT}</p>}
      </aside>

      <section className="flex flex-col px-5 py-6 sm:px-10">
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
      </section>
    </div>
  );
}
