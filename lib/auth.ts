"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
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
export const signInGoogle = () => signInWithPopup(firebase().auth, new GoogleAuthProvider());
export const resetPassword = (email: string) => sendPasswordResetEmail(firebase().auth, email.trim());
export const signOutUser = () => signOut(firebase().auth);

/** Firebase error codes → the key of a plain-language message in lib/i18n.ts */
export function authErrorKey(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  switch (code) {
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
    default:
      return "auth.error.other";
  }
}
