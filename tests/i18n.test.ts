import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dictionaries, translate, type Key } from "@/lib/i18n";

/* Every label in English and Afrikaans: nothing missing, nothing mistyped, same {placeholders} */

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

const code = ["app", "components", "lib"].flatMap((d) => files(join(process.cwd(), d))).map((f) => readFileSync(f, "utf8")).join("\n");
const en = dictionaries.en;
const af = dictionaries.af;
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("languages", () => {
  it("every label the code asks for exists", () => {
    const used = [...code.matchAll(/\b[td]\(\s*"([a-zA-Z0-9_.-]+)"/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(100);
    expect(used.filter((k) => !(k in en))).toEqual([]);
  });

  it("Afrikaans has every English label, with the same {placeholders}", () => {
    const keys = Object.keys(en) as Key[];
    expect(keys.filter((k) => !af[k]?.trim())).toEqual([]);
    expect(keys.filter((k) => placeholders(en[k]) !== placeholders(af[k]))).toEqual([]);
    expect(keys.filter((k) => en[k].includes("|") !== af[k].includes("|"))).toEqual([]);
  });

  it("fills in values and picks one or many", () => {
    expect(translate("en", "customers.documents", { n: 1 })).toBe("1 document");
    expect(translate("en", "customers.documents", { n: 3 })).toBe("3 documents");
    expect(translate("af", "customers.documents", { n: 3 })).toBe("3 dokumente");
    expect(translate("af", "sheet.taxInvoice")).toBe("Belastingfaktuur");
  });
});
