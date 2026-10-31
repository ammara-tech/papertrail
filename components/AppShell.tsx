"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { firebaseConfigured } from "@/lib/firebase";
import { connect, disconnect, useAppData } from "@/lib/store";
import LangProvider, { useT } from "@/components/LangProvider";
import Header from "@/components/Header";
import PhoneNav from "@/components/PhoneNav";
import Shortcuts from "@/components/Shortcuts";
import LoginScreen from "@/components/LoginScreen";
import Logo from "@/components/Logo";

/*
  Wraps every page. Until someone is signed in, it shows the sign-in screen instead
  of the page, so no page ever loads without an account. After sign-in it connects
  to that person's data (lib/store.ts) and shows the header, the phone bar and the page.
  The real protection is in firestore.rules: even a changed copy of this code can only
  ever read the signed-in person's own data.
*/
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <Gate>{children}</Gate>
    </LangProvider>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const data = useAppData();
  const t = useT();
  const uid = auth.status === "signedIn" ? auth.user.uid : null;

  useEffect(() => {
    if (uid) connect(uid);
    else disconnect();
  }, [uid]);

  if (!firebaseConfigured) return <SetupNeeded />;
  // Until Firebase has checked, both screens are on the page and the saved hint picks one
  // (see lib/auth.ts). The sign-in screen stays in the same place, so nothing typed is lost.
  if (auth.status !== "signedIn")
    return (
      <>
        {auth.status === "loading" && (
          <div className="gate-splash">
            <Splash text={t("app.opening")} />
          </div>
        )}
        <div className={auth.status === "loading" ? "gate-login" : undefined}>
          <LoginScreen />
        </div>
      </>
    );
  if (!data) return <Splash text={t("app.loadingData")} />;

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-sheet focus:px-4 focus:py-2 focus:text-carbon">
        {t("app.skip")}
      </a>
      <Header email={auth.user.email ?? ""} />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-20 print:p-0">
        {children}
      </main>
      <PhoneNav />
      <Shortcuts />
    </>
  );
}

function Splash({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-ink-soft">
      <Logo className="h-12 w-12 animate-pulse motion-reduce:animate-none" />
      <p role="status">{text}</p>
    </div>
  );
}

/* Shown only to a developer who hasn't added the Firebase settings yet */
function SetupNeeded() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-3xl font-bold">PaperTrail needs its Firebase settings</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Add the four NEXT_PUBLIC_FIREBASE_ settings to .env.local on your computer and restart npm run dev, or to Vercel&apos;s
        Environment Variables and redeploy. The README explains where to find them.
      </p>
    </div>
  );
}
