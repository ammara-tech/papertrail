"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  getRedirectResult,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { firebase, firebaseConfigured } from "@/lib/firebase";

/*
  Signing in with Firebase Authentication: email and password, or Google.
  Firebase stores passwords safely (PaperTrail never sees or saves them), sends the
  "reset password" emails, and limits repeated wrong guesses.
*/

export type AuthState = { status: "loading" } | { status: "signedOut" } | { status: "signedIn"; user: User };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: firebaseConfigured ? "loading" : "signedOut" });
  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(firebase().auth, (user) => setState(user ? { status: "signedIn", user } : { status: "signedOut" }));
  }, []);
  return state;
}

export const signInEmail = (email: string, password: string) => signInWithEmailAndPassword(firebase().auth, email.trim(), password);
export const signUpEmail = (email: string, password: string) => createUserWithEmailAndPassword(firebase().auth, email.trim(), password);
/**
 * Google sign-in opens a small Google window (a popup). If the browser won't open one
 * (some phones and in-app browsers block them), the whole page goes to Google instead and
 * comes back signed in.
 */
export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" }); // always let people choose which Google account
  try {
    return await signInWithPopup(firebase().auth, provider);
  } catch (error) {
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(errorCode(error))) {
      return signInWithRedirect(firebase().auth, provider);
    }
    throw error;
  }
}

/** After coming back from a full-page Google sign-in, any error shows up here. */
export const finishRedirectSignIn = () => getRedirectResult(firebase().auth);

export function errorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
}
export const resetPassword = (email: string) => sendPasswordResetEmail(firebase().auth, email.trim());
export const signOutUser = () => signOut(firebase().auth);

/** Firebase error codes → the key of a plain-language message in lib/i18n.ts */
export function authErrorKey(error: unknown): string {
  switch (errorCode(error)) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "auth.error.wrong";
    case "auth/email-already-in-use":
      return "auth.error.taken";
    case "auth/weak-password":
      return "auth.error.weak";
    case "auth/invalid-email":
      return "auth.error.email";
    case "auth/too-many-requests":
      return "auth.error.tooMany";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "auth.error.popupClosed";
    case "auth/popup-blocked":
      return "auth.error.popupBlocked";
    case "auth/network-request-failed":
      return "auth.error.offline";
    case "auth/account-exists-with-different-credential":
      return "auth.error.otherAccount";
    case "auth/user-disabled":
      return "auth.error.disabled";
    // The next ones mean the Firebase project isn't set up fully. Visitors can't fix them,
    // so the message says what's wrong, and the code shown underneath helps the owner.
    case "auth/unauthorized-domain":
      return "auth.error.domain";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "auth.error.method";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "auth.error.settings";
    default:
      return "auth.error.other";
  }
}
