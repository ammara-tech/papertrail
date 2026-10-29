import { describe, expect, it } from "vitest";
import { changesBetween, hasChanges } from "@/lib/diff";
import { createDocument, deleteDocument, updateDocument } from "@/lib/documents";
import { emptyData } from "@/lib/storage";

const today = "2026-10-29";

describe("saving only what changed", () => {
  it("finds nothing when nothing changed", () => {
    const data = createDocument(emptyData(), "quote", today).data;
    expect(hasChanges(changesBetween(data, data))).toBe(false);
  });

  it("saves a new document and the new number", () => {
    const before = emptyData();
    const { data, doc } = createDocument(before, "invoice", today);
    const c = changesBetween(before, data);
    expect(c.upserts.map((d) => d.id)).toEqual([doc.id]);
    expect(c.profile).toBe(true); // the counter went up
  });

  it("saves only the edited document, and notices deletions", () => {
    let data = createDocument(emptyData(), "quote", today).data;
    data = createDocument(data, "quote", today).data;
    const [a, b] = data.documents;
    const edited = updateDocument(data, a.id, { notes: "New note" });
    const c = changesBetween(data, edited);
    expect(c.upserts.map((d) => d.id)).toEqual([a.id]);
    expect(c.profile).toBe(false);
    expect(changesBetween(data, deleteDocument(data, b.id)).deletes).toEqual([b.id]);
  });
});
