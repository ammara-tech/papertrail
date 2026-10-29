"use client";

import { useSyncExternalStore } from "react";
import type { AppData } from "@/lib/types";
import { saveChanges, startSync } from "@/lib/cloud";

/*
  The app's one shared copy of the signed-in person's data.
  - connect(uid) starts listening to their data in Firestore (lib/cloud.ts).
  - setData(change) updates the screen straight away, then saves the difference.
  - useAppData() gives any component the latest data and re-draws it after a change.

  While our own changes are still being saved, updates from Firestore are ignored, so a
  slightly older copy can never jump back over what you just typed. Once Firestore
  confirms, its copy (which then includes your changes, and any from other devices) is used.
*/

export type SyncStatus = "loading" | "saved" | "saving" | "offline" | "error";

let cache: AppData | null = null;
let uid: string | null = null;
let status: SyncStatus = "loading";
let stop: (() => void) | null = null;
let inFlight = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function connect(userId: string) {
  if (uid === userId) return;
  disconnect();
  uid = userId;
  status = "loading";
  stop = startSync(
    userId,
    ({ data, pending }) => {
      if (cache === null || (!pending && inFlight === 0)) cache = data;
      status = pending ? (navigator.onLine ? "saving" : "offline") : "saved";
      notify();
    },
    () => {
      status = "error";
      notify();
    },
  );
  notify();
}

export function disconnect() {
  stop?.();
  stop = null;
  uid = null;
  cache = null;
  status = "loading";
  notify();
}

export function getData(): AppData | null {
  return cache;
}

/** Change the data: pass a function that returns the new data. */
export function setData(change: (data: AppData) => AppData) {
  if (!cache || !uid) return;
  const before = cache;
  cache = change(cache);
  status = navigator.onLine ? "saving" : "offline";
  notify();
  inFlight += 1;
  saveChanges(uid, before, cache)
    .catch(() => {
      status = "error";
    })
    .finally(() => {
      inFlight -= 1;
      notify();
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** null until the person's data has loaded (and while the page is first drawn on the server) */
export function useAppData(): AppData | null {
  return useSyncExternalStore(subscribe, () => cache, () => null);
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, () => status, () => "loading" as SyncStatus);
}
