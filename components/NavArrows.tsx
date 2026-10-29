"use client";

import Icon from "@/components/Icon";
import { useT } from "@/components/LangProvider";

/* Back, Forward and Refresh, like a browser's, for when PaperTrail is installed or full screen on a phone */
export default function NavArrows({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <button type="button" onClick={() => history.back()} aria-label={t("nav.back")} title={t("nav.back")} className="tool">
        <Icon name="back" />
      </button>
      <button type="button" onClick={() => history.forward()} aria-label={t("nav.forward")} title={t("nav.forward")} className="tool">
        <Icon name="forward" />
      </button>
      <button type="button" onClick={() => location.reload()} aria-label={t("nav.refresh")} title={t("nav.refresh")} className="tool">
        <Icon name="refresh" />
      </button>
    </div>
  );
}
