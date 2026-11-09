"use client";

import { deleteUser } from "firebase/auth";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { firebase } from "@/lib/firebase";
import { signOutUser } from "@/lib/auth";
import { todayISO } from "@/lib/dates";
import { demoData } from "@/lib/demo-data";
import { setData } from "@/lib/store";

/*
  "Try the demo": look around PaperTrail without making an account.
  - The guest gets their own private account (Firebase anonymous sign-in, lib/auth.ts), so the
    security rules protect a demo exactly like a real account.
  - The first time a guest has no documents, it's filled with a made-up business
    (lib/demo-data.ts). A note on the device remembers that, so deleting it doesn't bring it back.
  - "End the demo" deletes everything the guest saved, then the guest account itself.
*/

const seededKey = (uid: string) => `papertrail:demoSeeded:${uid}`;

/** Fills a new guest's empty account with the made-up business, once */
export function seedDemoOnce(uid: string, empty: boolean) {
  try {
    if (localStorage.getItem(seededKey(uid))) return;
    localStorage.setItem(seededKey(uid), "1");
  } catch {
    /* storage blocked: still seed, but only when it's empty */
  }
  if (empty) setData((d) => ({ ...d, ...demoData(todayISO(), new Date().toISOString()) }));
}

/** Deletes the guest's documents, expenses, stock, receipt photos and profile, then the guest account. Needs a connection. */
export async function endDemo() {
  const { auth, db } = firebase();
  const user = auth.currentUser;
  if (!user) return;
  const parts = await Promise.all(["documents", "expenses", "stock", "receipts"].map((name) => getDocs(collection(db, "users", user.uid, name))));
  const refs = [...parts.flatMap((p) => p.docs.map((d) => d.ref)), doc(db, "users", user.uid)];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db); // Firestore allows 500 changes per batch
    refs.slice(i, i + 450).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  try {
    localStorage.removeItem(seededKey(user.uid));
  } catch {
    /* nothing to remove */
  }
  try {
    await deleteUser(user);
  } catch {
    await signOutUser(); // if Firebase won't delete it, at least sign out
  }
}
