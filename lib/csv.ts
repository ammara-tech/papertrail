/*
  CSV files for Excel or Google Sheets (the Download CSV button on Documents).
  Client names come from people, so a cell that starts like a formula (= + - @)
  gets a ' in front, which stops a spreadsheet running it ("CSV injection").
  Tested in tests/messages.test.ts.
*/

export function csvCell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A byte-order mark at the start helps Excel read accents correctly */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
