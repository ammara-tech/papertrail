"use client";

import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import type { AppData } from "@/lib/types";
import { firebase } from "@/lib/firebase";
import { readData } from "@/lib/storage";
import { changesBetween, hasChanges } from "@/lib/diff";

/*
  Each person's data in Firestore:
    users/{their user id}                  business details and numbering
    users/{their user id}/documents/{id}   one quote or invoice each
    users/{their user id}/expenses/{id}    one expense each
    users/{their user id}/stock/{id}       one stock item each
    users/{their user id}/receipts/{id}    the receipt photo for the expense with the same id
                                           (loaded only when you open it, so the app stays quick)
  The rules in firestore.rules let a signed-in person read and write only their own.
*/

export type Snapshot = { data: AppData; pending: boolean };

/** Listens to the signed-in person's data. Calls onData with every update (including from their other devices). */
export function startSync(uid: string, onData: (s: Snapshot) => void, onError: (e: unknown) => void): () => void {
  const { db } = firebase();
  let profile: { value: unknown; pending: boolean } | null = null;
  let docs: { value: unknown[]; pending: boolean } | null = null;
  let expenses: { value: unknown[]; pending: boolean } | null = null;
  let stock: { value: unknown[]; pending: boolean } | null = null;

  const emit = () => {
    if (!profile || !docs || !expenses || !stock) return; // wait until all four have arrived
    const p = (profile.value ?? {}) as Record<string, unknown>;
    onData({
      data: readData({ business: p.business, counters: p.counters, documents: docs.value, expenses: expenses.value, stock: stock.value }),
      pending: profile.pending || docs.pending || expenses.pending || stock.pending,
    });
  };

  const stopProfile = onSnapshot(
    doc(db, "users", uid),
    { includeMetadataChanges: true },
    (snap) => {
      profile = { value: snap.exists() ? snap.data() : null, pending: snap.metadata.hasPendingWrites };
      emit();
    },
    onError,
  );
  const stopDocs = onSnapshot(
    collection(db, "users", uid, "documents"),
    { includeMetadataChanges: true },
    (snap) => {
      docs = { value: snap.docs.map((d) => d.data()), pending: snap.metadata.hasPendingWrites };
      emit();
    },
    onError,
  );
  const stopExpenses = onSnapshot(
    collection(db, "users", uid, "expenses"),
    { includeMetadataChanges: true },
    (snap) => {
      expenses = { value: snap.docs.map((d) => d.data()), pending: snap.metadata.hasPendingWrites };
      emit();
    },
    onError,
  );
  const stopStock = onSnapshot(
    collection(db, "users", uid, "stock"),
    { includeMetadataChanges: true },
    (snap) => {
      stock = { value: snap.docs.map((d) => d.data()), pending: snap.metadata.hasPendingWrites };
      emit();
    },
    onError,
  );
  return () => {
    stopProfile();
    stopDocs();
    stopExpenses();
    stopStock();
  };
}

/** Saves only what changed between two copies. Works offline: Firestore sends it when the connection is back. */
export async function saveChanges(uid: string, before: AppData, after: AppData) {
  const c = changesBetween(before, after);
  if (!hasChanges(c)) return;
  const { db } = firebase();
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];
  if (c.profile) ops.push((b) => b.set(doc(db, "users", uid), { version: 2, business: after.business, counters: after.counters }));
  for (const d of c.upserts) ops.push((b) => b.set(doc(db, "users", uid, "documents", d.id), d));
  for (const id of c.deletes) ops.push((b) => b.delete(doc(db, "users", uid, "documents", id)));
  for (const e of c.expenseUpserts) ops.push((b) => b.set(doc(db, "users", uid, "expenses", e.id), e));
  for (const id of c.expenseDeletes) {
    ops.push((b) => b.delete(doc(db, "users", uid, "expenses", id)));
    ops.push((b) => b.delete(doc(db, "users", uid, "receipts", id))); // its photo goes too (fine if there wasn't one)
  }
  for (const s of c.stockUpserts) ops.push((b) => b.set(doc(db, "users", uid, "stock", s.id), s));
  for (const id of c.stockDeletes) ops.push((b) => b.delete(doc(db, "users", uid, "stock", id)));
  // Firestore allows up to 500 changes per batch (a big backup restore can be more)
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

/* ---------- Receipt photos ---------- */

/** Saves a receipt photo (a small JPEG as a data: URL, made by lib/receipt-image.ts). Works offline too. */
export function saveReceipt(uid: string, expenseId: string, image: string) {
  return setDoc(doc(firebase().db, "users", uid, "receipts", expenseId), { image });
}

/** Loads a receipt photo, or null if there isn't one */
export async function loadReceipt(uid: string, expenseId: string): Promise<string | null> {
  const snap = await getDoc(doc(firebase().db, "users", uid, "receipts", expenseId));
  const image = snap.exists() ? snap.data()?.image : null;
  return typeof image === "string" && image.startsWith("data:image/jpeg;base64,") ? image : null;
}

export function deleteReceipt(uid: string, expenseId: string) {
  return deleteDoc(doc(firebase().db, "users", uid, "receipts", expenseId));
}
