"use client";

import { collection, doc, onSnapshot, writeBatch } from "firebase/firestore";
import type { AppData } from "@/lib/types";
import { firebase } from "@/lib/firebase";
import { readData } from "@/lib/storage";
import { changesBetween, hasChanges } from "@/lib/diff";

/*
  Each person's data in Firestore:
    users/{their user id}                  business details and numbering
    users/{their user id}/documents/{id}   one quote or invoice each
  The rules in firestore.rules let a signed-in person read and write only their own.
*/

export type Snapshot = { data: AppData; pending: boolean };

/** Listens to the signed-in person's data. Calls onData with every update (including from their other devices). */
export function startSync(uid: string, onData: (s: Snapshot) => void, onError: (e: unknown) => void): () => void {
  const { db } = firebase();
  let profile: { value: unknown; pending: boolean } | null = null;
  let docs: { value: unknown[]; pending: boolean } | null = null;

  const emit = () => {
    if (!profile || !docs) return; // wait until both have arrived
    const p = (profile.value ?? {}) as Record<string, unknown>;
    onData({ data: readData({ business: p.business, counters: p.counters, documents: docs.value }), pending: profile.pending || docs.pending });
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
  return () => {
    stopProfile();
    stopDocs();
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
  // Firestore allows up to 500 changes per batch (a big backup restore can be more)
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}
