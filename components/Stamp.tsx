"use client";

import type { StampLabel } from "@/lib/documents";
import { useT } from "@/components/LangProvider";

/* A rubber stamp: Paid (green), Part paid (amber), Overdue (red), Accepted (blue), Declined (grey) */
const colours: Record<StampLabel, string> = {
  paid: "text-paid",
  partPaid: "text-partpaid",
  overdue: "text-overdue",
  accepted: "text-carbon",
  declined: "text-ink-soft",
};

export default function Stamp({ label, land = false, onSlip = false }: { label: StampLabel; land?: boolean; onSlip?: boolean }) {
  const t = useT();
  const colour = onSlip && label === "declined" ? "text-slip-soft" : colours[label];
  return <span className={`stamp inline-block text-sm ${colour} ${land ? "stamp-land" : ""}`}>{t(`stamp.${label}`)}</span>;
}
