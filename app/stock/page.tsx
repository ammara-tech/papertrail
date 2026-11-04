"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { setData, useAppData } from "@/lib/store";
import { addStock, countStock, createStock, deleteStock, formatQty, matchesStock, parseQty, stockList, updateStock, type StockFields, type StockRow } from "@/lib/stock";
import { formatRand } from "@/lib/money";
import { useLang, useT } from "@/components/LangProvider";
import PriceInput from "@/components/PriceInput";
import Icon from "@/components/Icon";

/*
  Stock: what you sell from the shelf, how many are left, and which are running low.
  - Add an item with its name (as it goes on the invoice), price, how many you have, and when to warn.
  - Each item shows what's left, worked out from your invoices (lib/stock.ts).
  - "Add stock" for a delivery, "Count" after counting the shelf, Edit and Delete.
  - On an invoice, "From your stock" fills in a line and takes it off what's left.
*/

type Mode = { id: string; kind: "delivery" | "count" | "edit" } | null;

export default function StockPage() {
  const data = useAppData();
  const t = useT();
  const lang = useLang();
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<Mode>(null);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => (data ? stockList(data) : []), [data]);
  if (!data) return null;
  const shown = rows.filter((r) => matchesStock(r, query));
  const warnings = rows.filter((r) => r.state !== "ok").length;
  const qty = (n: number) => formatQty(n, lang);

  function remove(r: StockRow) {
    if (!window.confirm(t("stock.deleteConfirm", { name: r.name }))) return;
    setData((d) => deleteStock(d, r.id));
    if (mode?.id === r.id) setMode(null);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("stock.title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("stock.intro")}</p>

      {warnings > 0 && (
        <p role="status" className="mt-6 flex items-center gap-3 rounded-xl border border-overdue/40 bg-sheet px-4 py-3 font-semibold text-overdue">
          <Icon name="box" className="h-5 w-5 shrink-0" />
          {t("stock.lowSummary", { n: warnings })}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{t("stock.listTitle", { n: rows.length })}</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          {rows.length > 5 && (
            <label className="block">
              <span className="sr-only">{t("stock.search")}</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("stock.search")} className="field mt-0 w-56" />
            </label>
          )}
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-lg bg-carbon px-4 py-2 font-semibold text-on-carbon hover:opacity-90">
              <Icon name="plus" className="h-4 w-4" />
              {t("stock.add")}
            </button>
          )}
        </div>
      </div>

      {adding && (
        <StockForm
          start={{ name: "", code: "", price: 0, counted: 0, lowAt: 0 }}
          countLabel={t("stock.field.counted")}
          onCancel={() => setAdding(false)}
          onSave={(fields) => {
            setData((d) => createStock(d, fields).data);
            setAdding(false);
          }}
        />
      )}

      {rows.length === 0 && !adding ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-ink-soft">{t("stock.empty")}</p>
      ) : shown.length === 0 && rows.length > 0 ? (
        <p className="mt-6 text-ink-soft">{t("stock.noMatch")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-sheet">
          {shown.map((r) =>
            mode?.id === r.id && mode.kind === "edit" ? (
              <li key={r.id} className="p-4">
                <StockForm
                  start={{ name: r.name, code: r.code, price: r.price, counted: r.left < 0 ? 0 : r.left, lowAt: r.lowAt }}
                  countLabel={t("stock.field.countedNow")}
                  onCancel={() => setMode(null)}
                  onSave={(fields) => {
                    const { counted, ...rest } = fields;
                    setData((d) => {
                      const edited = updateStock(d, r.id, rest);
                      // Only a changed number counts as a new count
                      return counted === Math.max(0, r.left) ? edited : countStock(edited, r.id, counted);
                    });
                    setMode(null);
                  }}
                />
              </li>
            ) : (
              <li key={r.id} className="p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-ink-soft">
                      {t("stock.each", { price: formatRand(r.price) })}
                      {r.code && ` · ${t("stock.code", { code: r.code })}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${r.state === "ok" ? "" : "text-overdue"}`}>{r.left < 0 ? t("stock.short", { n: qty(-r.left) }) : t("stock.left", { n: qty(r.left) })}</p>
                    {r.state !== "ok" && <p className="text-xs font-semibold uppercase tracking-wide text-overdue">{t(r.state === "out" ? "stock.state.out" : "stock.state.low")}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setMode({ id: r.id, kind: "delivery" })} className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-carbon">
                      {t("stock.delivery")}
                      <span className="sr-only">: {r.name}</span>
                    </button>
                    <button type="button" onClick={() => setMode({ id: r.id, kind: "count" })} className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-carbon">
                      {t("stock.count")}
                      <span className="sr-only">: {r.name}</span>
                    </button>
                    <button type="button" onClick={() => setMode({ id: r.id, kind: "edit" })} className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-carbon">
                      {t("stock.edit")}
                      <span className="sr-only">: {r.name}</span>
                    </button>
                    <button type="button" onClick={() => remove(r)} className="rounded-md border border-line px-3 py-1.5 text-sm text-overdue hover:border-overdue">
                      {t("stock.delete")}
                      <span className="sr-only">: {r.name}</span>
                    </button>
                  </div>
                </div>
                {mode?.id === r.id && mode.kind !== "edit" && (
                  <QuickNumber
                    label={mode.kind === "delivery" ? t("stock.deliveryLabel") : t("stock.countLabel")}
                    start={mode.kind === "count" ? Math.max(0, r.left) : null}
                    onCancel={() => setMode(null)}
                    onSave={(n) => {
                      setData((d) => (mode.kind === "delivery" ? addStock(d, r.id, n) : countStock(d, r.id, n)));
                      setMode(null);
                    }}
                  />
                )}
              </li>
            ),
          )}
        </ul>
      )}

      <section aria-labelledby="stock-how" className="mt-8 rounded-xl bg-page p-4 text-sm text-ink-soft">
        <h2 id="stock-how" className="font-semibold text-ink">
          {t("stock.howTitle")}
        </h2>
        <p className="mt-1">{t("stock.how")}</p>
      </section>
    </div>
  );
}

/* ---------- Add or edit a stock item ---------- */

function StockForm({ start, countLabel, onSave, onCancel }: { start: StockFields; countLabel: string; onSave: (f: StockFields) => void; onCancel: () => void }) {
  const t = useT();
  const lang = useLang();
  const [form, setForm] = useState(start);
  const [counted, setCounted] = useState(start.counted ? formatQty(start.counted, lang) : "");
  const [lowAt, setLowAt] = useState(start.lowAt ? formatQty(start.lowAt, lang) : "");
  const [error, setError] = useState(false);
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => first.current?.focus(), []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) return setError(true);
    onSave({ ...form, name: form.name.trim(), code: form.code.trim(), counted: parseQty(counted) ?? 0, lowAt: parseQty(lowAt) ?? 0 });
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl border border-carbon/40 bg-sheet p-5 sm:grid-cols-2">
      <label className="block text-sm text-ink-soft sm:col-span-2">
        {t("stock.field.name")}
        <input ref={first} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={200} placeholder={t("stock.field.nameHint")} className="field" />
      </label>
      <label className="block text-sm text-ink-soft">
        {t("stock.field.price")}
        <PriceInput cents={form.price} onChange={(price) => setForm({ ...form, price })} label={t("stock.field.price")} className="field" />
      </label>
      <label className="block text-sm text-ink-soft">
        {t("stock.field.code")}
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={50} placeholder={t("stock.field.codeHint")} className="field" />
      </label>
      <label className="block text-sm text-ink-soft">
        {countLabel}
        <input inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="0" className="field" />
      </label>
      <label className="block text-sm text-ink-soft">
        {t("stock.field.lowAt")}
        <input inputMode="decimal" value={lowAt} onChange={(e) => setLowAt(e.target.value)} placeholder="0" aria-describedby="low-hint" className="field" />
        <span id="low-hint" className="mt-1 block text-xs">
          {t("stock.field.lowAtHint")}
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-overdue sm:col-span-2">
          {t("stock.nameNeeded")}
        </p>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" className="rounded-lg bg-carbon px-5 py-2 font-semibold text-on-carbon hover:opacity-90">
          {t("stock.save")}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-5 py-2 font-semibold hover:border-carbon">
          {t("stock.cancel")}
        </button>
      </div>
    </form>
  );
}

/* ---------- One number: a delivery, or a new count ---------- */

function QuickNumber({ label, start, onSave, onCancel }: { label: string; start: number | null; onSave: (n: number) => void; onCancel: () => void }) {
  const t = useT();
  const lang = useLang();
  const [text, setText] = useState(start === null ? "" : formatQty(start, lang));
  const box = useRef<HTMLInputElement>(null);
  useEffect(() => {
    box.current?.focus();
    box.current?.select();
  }, []);
  const n = parseQty(text);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (n !== null) onSave(n);
      }}
      className="mt-3 flex flex-wrap items-end gap-2"
    >
      <label className="block text-sm text-ink-soft">
        {label}
        <input ref={box} inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Escape" && onCancel()} className="field w-40" />
      </label>
      <button type="submit" disabled={n === null} className="rounded-lg bg-carbon px-4 py-2 font-semibold text-on-carbon hover:opacity-90 disabled:opacity-50">
        {t("stock.apply")}
      </button>
      <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 font-semibold hover:border-carbon">
        {t("stock.cancel")}
      </button>
    </form>
  );
}
