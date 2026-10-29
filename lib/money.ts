/*
  Money helpers. Amounts are cents (whole numbers).
  Tested in tests/money.test.ts.
*/

/**
 * 125050 → "R 1 250,50" (the South African standard: spaces between thousands, a comma for cents).
 * Built by hand instead of with the browser's number formatting, because browsers disagree
 * about South African formatting, and an invoice must look the same on every device.
 * The spaces are non-breaking, so an amount never splits over two lines.
 */
export function formatRand(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const rands = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  const c = String(abs % 100).padStart(2, "0");
  return `${sign}R\u00a0${rands},${c}`;
}

/**
 * Reads what someone typed as a price and returns cents, or null if it isn't a number.
 * Accepts "1250", "1250.50", "1250,50", "R 1 250,50" and "1,250.50".
 */
export function parseRand(text: string): number | null {
  let s = text.replace(/[Rr\s\u00a0]/g, "");
  if (s === "" || !/^-?[\d.,]+$/.test(s)) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    // Both used: whichever comes last is the decimal point, the other separates thousands
    const decimal = lastComma > lastDot ? "," : ".";
    s = s.replace(decimal === "," ? /\./g : /,/g, "").replace(",", ".");
  } else if (lastComma !== -1) {
    // Only commas: "1250,5" or "1250,50" is a decimal; "1,250" or "1,250,000" separates thousands
    const after = s.length - lastComma - 1;
    s = after <= 2 && s.indexOf(",") === lastComma ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if ((s.match(/\./g) ?? []).length > 1) {
    return null; // "1.2.3" isn't a price
  }
  const value = Number(s);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** Cents as a plain number for a price box: 125050 → "1250.50", 125000 → "1250" */
export function centsToInput(cents: number): string {
  const whole = Math.trunc(cents / 100);
  const rest = Math.abs(cents % 100);
  return rest === 0 ? String(whole) : `${whole}.${String(rest).padStart(2, "0")}`;
}
