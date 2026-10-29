"use client";

import { useSyncStatus } from "@/lib/store";
import { useT } from "@/components/LangProvider";
import Icon from "@/components/Icon";

/* Shows whether everything is saved to the account, still saving, or waiting for a connection */
export default function SyncBadge() {
  const status = useSyncStatus();
  const t = useT();
  if (status === "loading") return null;
  const text = t(`sync.${status}` as const);
  const colour = status === "saved" ? "text-paid" : status === "error" ? "text-overdue" : "text-ink-soft";
  return (
    <span role="status" title={text} className={`flex h-9 w-9 items-center justify-center ${colour}`}>
      <Icon name={status === "saved" ? "check" : "cloud"} className="h-5 w-5" />
      <span className="sr-only">{text}</span>
    </span>
  );
}
