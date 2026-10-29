import type { AppData, Doc } from "@/lib/types";

/*
  What changed between two copies of the data, so lib/cloud.ts saves only that:
  the documents that are new or different, the ones that were deleted, and
  whether the business details or numbering changed. Tested in tests/diff.test.ts.
*/

export type Changes = { profile: boolean; upserts: Doc[]; deletes: string[] };

export function changesBetween(before: AppData, after: AppData): Changes {
  const old = new Map(before.documents.map((d) => [d.id, d]));
  const now = new Set(after.documents.map((d) => d.id));
  return {
    profile:
      JSON.stringify(before.business) !== JSON.stringify(after.business) ||
      JSON.stringify(before.counters) !== JSON.stringify(after.counters),
    // Same object means unchanged (every edit makes a new object), so this is quick even with many documents
    upserts: after.documents.filter((d) => old.get(d.id) !== d && JSON.stringify(old.get(d.id)) !== JSON.stringify(d)),
    deletes: [...old.keys()].filter((id) => !now.has(id)),
  };
}

export const hasChanges = (c: Changes) => c.profile || c.upserts.length > 0 || c.deletes.length > 0;
