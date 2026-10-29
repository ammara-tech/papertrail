import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";

/*
  Connecting to Firebase: Authentication (sign-in) and Firestore (the database).

  The settings come from environment variables (see README). They're public by design:
  Firebase's web settings identify the project, they don't unlock anything.
  What protects each person's data are the security rules in firestore.rules.

  Firestore keeps a copy of the user's data on the device (persistentLocalCache),
  so PaperTrail opens and saves offline, and syncs when the connection is back.
  Everything starts only in the browser, never while Next.js builds the pages.
*/

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

let services: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

export function firebase() {
  if (!firebaseConfigured) throw new Error("Firebase isn't set up: add the NEXT_PUBLIC_FIREBASE_ settings (see README).");
  if (!services) {
    const app = getApps()[0] ?? initializeApp(config);
    services = {
      app,
      auth: getAuth(app),
      db: initializeFirestore(app, {
        ignoreUndefinedProperties: true, // optional fields like "fromQuote" can be missing
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      }),
    };
  }
  return services;
}
