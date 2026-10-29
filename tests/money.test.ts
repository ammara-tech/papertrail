import { describe, expect, it } from "vitest";
import { centsToInput, formatRand, parseRand } from "@/lib/money";

describe("money", () => {
  it("shows rand the South African way", () => {
    expect(formatRand(125050)).toBe("R\u00a01\u00a0250,50");
    expect(formatRand(0)).toBe("R\u00a00,00");
    expect(formatRand(123456789)).toBe("R\u00a01\u00a0234\u00a0567,89");
    expect(formatRand(-5000)).toBe("-R\u00a050,00");
  });

  it("reads prices however people type them", () => {
    expect(parseRand("1250")).toBe(125000);
    expect(parseRand("1250.50")).toBe(125050);
    expect(parseRand("1250,5")).toBe(125050);
    expect(parseRand("R 1 250,50")).toBe(125050);
    expect(parseRand("1,250.50")).toBe(125050);
    expect(parseRand("1,250")).toBe(125000);
  });

  it("says no to things that aren't prices", () => {
    expect(parseRand("")).toBe(null);
    expect(parseRand("abc")).toBe(null);
    expect(parseRand("1.2.3")).toBe(null);
  });

  it("puts cents back in a price box without extra zeros", () => {
    expect(centsToInput(125050)).toBe("1250.50");
    expect(centsToInput(125000)).toBe("1250");
    expect(centsToInput(5)).toBe("0.05");
  });
});
