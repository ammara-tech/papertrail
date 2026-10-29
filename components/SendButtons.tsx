"use client";

import type { Business, Doc } from "@/lib/types";
import { emailLink, messageText, whatsappLink, type MessageKind } from "@/lib/messages";
import { todayISO } from "@/lib/dates";
import { translate } from "@/lib/i18n";
import { useT } from "@/components/LangProvider";
import Icon from "@/components/Icon";

/*
  "Send by WhatsApp" and "Send by email" (or the reminder versions). They open the
  user's own WhatsApp or email app with the message written, in the document
  language from Business details. Nothing is sent until the user presses Send there.
  The PDF itself is attached by hand (Download PDF first).
*/
export default function SendButtons({ doc, business, kind, compact = false }: { doc: Doc; business: Business; kind: MessageKind; compact?: boolean }) {
  const t = useT();
  const text = messageText(doc, business, kind, todayISO(), business.docLanguage);
  const subjectKey = kind === "reminder" ? "message.subjectReminder" : doc.type === "quote" ? "message.subjectQuote" : "message.subjectInvoice";
  const subject = translate(business.docLanguage, subjectKey, { n: doc.number, business: business.name || "PaperTrail" });
  const wa = whatsappLink(doc.client.phone, text);
  const mail = emailLink(doc.client.email, subject, text);
  const size = compact ? "px-3 py-1.5 text-sm" : "px-4 py-2";

  if (!wa && !mail) return <p className="text-sm text-ink-soft">{t("send.needContact")}</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 rounded-lg border border-line bg-sheet font-semibold hover:border-paid ${size}`}>
          <Icon name="whatsapp" className="h-5 w-5 text-paid" />
          {kind === "reminder" ? t("send.remindWhatsapp") : t("send.whatsapp")}
          <span className="sr-only"> ({t("common.opensNewTab")})</span>
        </a>
      )}
      {mail && (
        <a href={mail} className={`inline-flex items-center gap-2 rounded-lg border border-line bg-sheet font-semibold hover:border-carbon ${size}`}>
          <Icon name="mail" className="h-5 w-5 text-carbon" />
          {kind === "reminder" ? t("send.remindEmail") : t("send.email")}
        </a>
      )}
    </div>
  );
}
