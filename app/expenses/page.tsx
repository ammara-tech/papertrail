"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { getUid, setData, useAppData } from "@/lib/store";
import { claimableVat, createExpense, deleteExpense, expensesCsv, expensesIn, CATEGORY_ORDER, periods, summarise, updateExpense, type PeriodKey } from "@/lib/expenses";
import { deleteReceipt, loadReceipt, saveReceipt } from "@/lib/cloud";
import { shrinkReceipt } from "@/lib/receipt-image";
import { formatRand } from "@/lib/money";
import { formatDate, todayISO } from "@/lib/dates";
import type { Expense, ExpenseCategory } from "@/lib/types";
import type { Key } from "@/lib/i18n";
import { useLang, useT } from "@/components/LangProvider";
import PriceInput from "@/components/PriceInput";
import Icon from "@/components/Icon";

/*
  Expenses and profit.
  - The money card: sales, expenses and profit for a period, and the VAT owed to SARS
    (for VAT-registered businesses), worked out in lib/expenses.ts.
  - Add an expense: the date, who was paid, what for, the amount and a receipt photo,
    which is made small on the phone first (lib/receipt-image.ts).
  - The list for the period, with each receipt, Edit and Delete, and a CSV for an accountant.
*/

type Form = { date: string; supplier: string; description: string; category: ExpenseCategory; amount: number; vatClaimable: boolean };

const PERIOD_KEYS: PeriodKey[] = ["thisMonth", "lastMonth", "vatPeriod", "taxYear"];

export default function ExpensesPage() {
  const data = useAppData();
  const t = useT();
  const lang = useLang();
  const today = todayISO();
  const [periodKey, setPeriodKey] = useState<PeriodKey>("thisMonth");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [receipt, setReceipt] = useState<{ expense: Expense; image: string | null } | null>(null);

  const period = periods(today)[periodKey];
  const summary = useMemo(() => (data ? summarise(data, period) : null), [data, period]);
  const list = useMemo(() => (data ? expensesIn(data, period) : []), [data, period]);
  if (!data || !summary) return null;

  const range = `${formatDate(period.from, lang)} – ${formatDate(period.to, lang)}`;
  const categoryName = (c: ExpenseCategory) => t(`expenses.category.${c}` as Key);

  function remove(e: Expense) {
    if (!window.confirm(t("expenses.deleteConfirm", { supplier: e.supplier || t("expenses.noSupplier") }))) return;
    setData((d) => deleteExpense(d, e.id));
    if (editing === e.id) setEditing(null);
  }

  async function showReceipt(e: Expense) {
    const uid = getUid();
    setReceipt({ expense: e, image: null });
    const image = uid ? await loadReceipt(uid, e.id).catch(() => null) : null;
    setReceipt({ expense: e, image: image ?? "" });
  }

  function downloadCsv() {
    const headers = [t("expenses.csv.date"), t("expenses.csv.supplier"), t("expenses.csv.description"), t("expenses.csv.category"), t("expenses.csv.amount"), t("expenses.csv.vat"), t("expenses.csv.receipt")];
    const csv = expensesCsv(list, headers, categoryName, t("expenses.yes"), t("expenses.no"));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `papertrail-expenses-${period.from}-to-${period.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("expenses.title")}</h1>
      <p className="mt-2 max-w-2xl text-lg text-ink-soft">{t("expenses.intro")}</p>

      {/* Which period */}
      <div role="group" aria-label={t("expenses.period")} className="mt-8 flex flex-wrap gap-2">
        {PERIOD_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={periodKey === k}
            onClick={() => setPeriodKey(k)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${periodKey === k ? "border-carbon bg-carbon text-on-carbon" : "border-line bg-sheet text-ink-soft hover:border-carbon"}`}
          >
            {t(`expenses.period.${k}` as Key)}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-soft">{range}</p>

      {/* The money card */}
      <section aria-labelledby="money-title" className="mt-4 rounded-xl border border-line bg-sheet p-5 sm:p-6">
        <h2 id="money-title" className="sr-only">
          {t("expenses.moneyTitle")}
        </h2>
        <dl className="grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink-soft">{summary.vatRegistered ? t("expenses.sales", { n: summary.invoices }) : t("expenses.salesNoVat", { n: summary.invoices })}</dt>
            <dd className="text-2xl font-bold">{formatRand(summary.sales)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">{summary.vatRegistered ? t("expenses.spentNet") : t("expenses.spent")}</dt>
            <dd className="text-2xl font-bold">{formatRand(summary.expensesNet)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">{summary.profit >= 0 ? t("expenses.profit") : t("expenses.loss")}</dt>
            <dd className={`text-2xl font-bold ${summary.profit >= 0 ? "text-paid" : "text-overdue"}`}>{formatRand(Math.abs(summary.profit))}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-ink-soft">{t("expenses.received", { amount: formatRand(summary.received) })}</p>

        {summary.vatRegistered ? (
          <div className="mt-5 rounded-lg bg-page p-4">
            <h3 className="font-semibold">{t("expenses.vatTitle")}</h3>
            <dl className="mt-2 grid gap-1 text-sm sm:max-w-md">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">{t("expenses.outputVat")}</dt>
                <dd>{formatRand(summary.outputVat)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">{t("expenses.inputVat")}</dt>
                <dd>−{formatRand(summary.inputVat)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-1 font-bold">
                <dt>{summary.vatOwed >= 0 ? t("expenses.vatOwed") : t("expenses.vatRefund")}</dt>
                <dd>{formatRand(Math.abs(summary.vatOwed))}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-5 rounded-lg bg-page p-4 text-sm text-ink-soft">{t("expenses.notVatRegistered")}</p>
        )}

        {summary.byCategory.length > 0 && (
          <div className="mt-5">
            <h3 className="font-semibold">{t("expenses.whereTitle")}</h3>
            <ul className="mt-2 space-y-2">
              {summary.byCategory.map((c) => (
                <li key={c.category} className="text-sm">
                  <div className="flex justify-between gap-4">
                    <span>{categoryName(c.category)}</span>
                    <span className="font-semibold">{formatRand(c.total)}</span>
                  </div>
                  <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-page">
                    <div className="h-2 rounded-full bg-carbon" style={{ width: `${Math.max(3, (c.total / summary.expensesTotal) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-5 text-xs text-ink-soft">{t("expenses.guide")}</p>
      </section>

      {/* Add, and the list */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">{t("expenses.listTitle", { n: list.length })}</h2>
        <div className="ml-auto flex flex-wrap gap-2">
          {list.length > 0 && (
            <button type="button" onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-lg border border-line bg-sheet px-3 py-2 text-sm font-semibold hover:border-carbon">
              <Icon name="download" className="h-4 w-4" />
              {t("expenses.csv")}
            </button>
          )}
          {editing !== "new" && (
            <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-lg bg-carbon px-4 py-2 font-semibold text-on-carbon hover:opacity-90">
              <Icon name="plus" className="h-4 w-4" />
              {t("expenses.add")}
            </button>
          )}
        </div>
      </div>

      {editing === "new" && (
        <ExpenseForm
          start={{ date: today, supplier: "", description: "", category: "materials", amount: 0, vatClaimable: summary.vatRegistered }}
          vatRegistered={summary.vatRegistered}
          hadReceipt={false}
          onCancel={() => setEditing(null)}
          onSave={(fields, photo) => {
            let id = "";
            setData((d) => {
              const made = createExpense(d, { ...fields, hasReceipt: Boolean(photo) });
              id = made.expense.id;
              return made.data;
            });
            const uid = getUid();
            if (photo && uid && id) saveReceipt(uid, id, photo).catch(() => {});
            setEditing(null);
          }}
        />
      )}

      {list.length === 0 && editing !== "new" ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-ink-soft">{t("expenses.empty")}</p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-sheet">
          {list.map((e) =>
            editing === e.id ? (
              <li key={e.id} className="p-4">
                <ExpenseForm
                  start={e}
                  vatRegistered={summary.vatRegistered}
                  hadReceipt={e.hasReceipt}
                  onCancel={() => setEditing(null)}
                  onSave={(fields, photo, removePhoto) => {
                    const uid = getUid();
                    const hasReceipt = photo ? true : removePhoto ? false : e.hasReceipt;
                    setData((d) => updateExpense(d, e.id, { ...fields, hasReceipt }));
                    if (uid && photo) saveReceipt(uid, e.id, photo).catch(() => {});
                    if (uid && removePhoto && !photo) deleteReceipt(uid, e.id).catch(() => {});
                    setEditing(null);
                  }}
                />
              </li>
            ) : (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-semibold">{e.supplier || t("expenses.noSupplier")}</p>
                  <p className="truncate text-sm text-ink-soft">
                    {formatDate(e.date, lang)} · {categoryName(e.category)}
                    {e.description && ` · ${e.description}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatRand(e.amount)}</p>
                  {summary.vatRegistered && claimableVat(e) > 0 && <p className="text-xs text-ink-soft">{t("expenses.vatIn", { amount: formatRand(claimableVat(e)) })}</p>}
                </div>
                <div className="flex gap-2">
                  {e.hasReceipt && (
                    <button type="button" onClick={() => showReceipt(e)} className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-carbon">
                      {t("expenses.receipt")}
                      <span className="sr-only"> {e.supplier}</span>
                    </button>
                  )}
                  <button type="button" onClick={() => setEditing(e.id)} className="rounded-md border border-line px-3 py-1.5 text-sm hover:border-carbon">
                    {t("expenses.edit")}
                    <span className="sr-only"> {e.supplier}</span>
                  </button>
                  <button type="button" onClick={() => remove(e)} className="rounded-md border border-line px-3 py-1.5 text-sm text-overdue hover:border-overdue">
                    {t("expenses.delete")}
                    <span className="sr-only"> {e.supplier}</span>
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {receipt && <ReceiptViewer receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

/* ---------- Add or edit an expense ---------- */

function ExpenseForm({
  start,
  vatRegistered,
  hadReceipt,
  onSave,
  onCancel,
}: {
  start: Form;
  vatRegistered: boolean;
  hadReceipt: boolean;
  onSave: (fields: Form, photo: string | null, removePhoto: boolean) => void;
  onCancel: () => void;
}) {
  const t = useT();
  const [form, setForm] = useState<Form>({
    date: start.date,
    supplier: start.supplier,
    description: start.description,
    category: start.category,
    amount: start.amount,
    vatClaimable: start.vatClaimable,
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Key | null>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => first.current?.focus(), []);

  const set = (change: Partial<Form>) => setForm((f) => ({ ...f, ...change }));

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const small = await shrinkReceipt(file);
    setBusy(false);
    if (!small) return setError("expenses.photoError");
    setPhoto(small);
    setRemovePhoto(false);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.amount) return setError("expenses.amountNeeded");
    onSave({ ...form, supplier: form.supplier.trim(), description: form.description.trim(), vatClaimable: vatRegistered && form.vatClaimable }, photo, removePhoto);
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 rounded-xl border border-carbon/40 bg-sheet p-5 sm:grid-cols-2">
      <label className="block text-sm text-ink-soft">
        {t("expenses.field.supplier")}
        <input ref={first} value={form.supplier} onChange={(e) => set({ supplier: e.target.value })} maxLength={200} placeholder={t("expenses.field.supplierHint")} className="field" />
      </label>
      <label className="block text-sm text-ink-soft">
        {t("expenses.field.date")}
        <input type="date" required value={form.date} onChange={(e) => set({ date: e.target.value })} className="field" />
      </label>
      <label className="block text-sm text-ink-soft">
        {t("expenses.field.description")}
        <input value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={500} placeholder={t("expenses.field.descriptionHint")} className="field" />
      </label>
      <label className="block text-sm text-ink-soft">
        {t("expenses.field.category")}
        <select value={form.category} onChange={(e) => set({ category: e.target.value as ExpenseCategory })} className="field">
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {t(`expenses.category.${c}` as Key)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-ink-soft">
        {t("expenses.field.amount")}
        <PriceInput cents={form.amount} onChange={(amount) => set({ amount })} label={t("expenses.field.amount")} className="field" />
      </label>
      {vatRegistered && (
        <label className="flex items-start gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={form.vatClaimable} onChange={(e) => set({ vatClaimable: e.target.checked })} className="mt-1" />
          <span>{t("expenses.field.vat")}</span>
        </label>
      )}

      <div className="sm:col-span-2">
        <p className="text-sm text-ink-soft">{t("expenses.field.receipt")}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-carbon focus-within:border-carbon">
            <Icon name="plus" className="h-4 w-4" />
            {photo || (hadReceipt && !removePhoto) ? t("expenses.photoChange") : t("expenses.photoAdd")}
            <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0])} className="sr-only" />
          </label>
          {busy && <span className="text-sm text-ink-soft">{t("expenses.photoWorking")}</span>}
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- a preview of the photo just picked
            <img src={photo} alt={t("expenses.photoPreview")} className="h-16 w-16 rounded border border-line object-cover" />
          )}
          {hadReceipt && !photo && !removePhoto && (
            <button type="button" onClick={() => setRemovePhoto(true)} className="text-sm text-overdue underline-offset-2 hover:underline">
              {t("expenses.photoRemove")}
            </button>
          )}
          {removePhoto && <span className="text-sm text-ink-soft">{t("expenses.photoWillRemove")}</span>}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-overdue sm:col-span-2">
          {t(error)}
        </p>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-carbon px-5 py-2 font-semibold text-on-carbon hover:opacity-90 disabled:opacity-60">
          {t("expenses.save")}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-5 py-2 font-semibold hover:border-carbon">
          {t("expenses.cancel")}
        </button>
      </div>
    </form>
  );
}

/* ---------- Looking at a receipt ---------- */

function ReceiptViewer({ receipt, onClose }: { receipt: { expense: Expense; image: string | null }; onClose: () => void }) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} onClose={onClose} className="m-auto max-h-[90vh] w-[min(92vw,40rem)] rounded-xl border border-line bg-sheet p-4 text-ink backdrop:bg-black/60">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{t("expenses.receiptOf", { supplier: receipt.expense.supplier || t("expenses.noSupplier") })}</h2>
        <button type="button" onClick={() => dialog.current?.close()} aria-label={t("expenses.close")} className="rounded-md p-1 hover:bg-page">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3">
        {receipt.image === null ? (
          <p className="text-ink-soft">{t("expenses.receiptLoading")}</p>
        ) : receipt.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- the saved receipt photo
          <img src={receipt.image} alt={t("expenses.receiptOf", { supplier: receipt.expense.supplier || t("expenses.noSupplier") })} className="max-h-[70vh] w-full rounded object-contain" />
        ) : (
          <p className="text-ink-soft">{t("expenses.receiptMissing")}</p>
        )}
      </div>
    </dialog>
  );
}
