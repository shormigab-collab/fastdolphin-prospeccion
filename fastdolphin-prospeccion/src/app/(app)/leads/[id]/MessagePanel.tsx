"use client";

import { useEffect, useState, useTransition } from "react";
import {
  generateDraftAction,
  updateDraftAction,
  approveMessageAction,
  markSentAction,
  discardMessageAction,
} from "./actions";
import { useLanguage } from "@/components/LanguageProvider";
import type { MessageDraft } from "@/lib/types";

export function MessagePanel({
  signalId,
  messages,
}: {
  signalId: string;
  messages: MessageDraft[];
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<MessageDraft["channel"]>("email");
  const [draftText, setDraftText] = useState("");
  const [subject, setSubject] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const statusLabel: Record<MessageDraft["status"], string> = {
    pendiente_aprobacion: t.message.statusDraft,
    aprobado: t.message.statusApproved,
    enviado: t.message.statusSent,
    descartado: t.message.statusDiscarded,
  };

  const TABS: { key: MessageDraft["channel"]; label: string }[] = [
    { key: "email", label: t.message.email },
    { key: "linkedin", label: t.message.linkedin },
  ];

  const current = messages.find((m) => m.channel === tab) ?? null;
  const channelLabel = tab === "email" ? t.message.channelEmail : t.message.channelLinkedin;

  useEffect(() => {
    setDraftText(current?.draft_text ?? "");
    setSubject(current?.subject ?? "");
    setCopied(false);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, tab]);

  async function handleCopy() {
    const text = tab === "email" && subject ? `${t.message.subject}: ${subject}\n\n${draftText}` : draftText;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin acceso al portapapeles (poco común) — no rompemos la UI por esto.
    }
  }

  function handleSave() {
    if (!current) return;
    startTransition(async () => {
      await updateDraftAction(current.id, signalId, {
        draftText,
        subject: tab === "email" ? subject : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t.message.title}
        </h2>
        {current && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {statusLabel[current.status]}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">{t.message.subtitle}</p>

      <div className="mt-4 flex gap-1 border-b border-slate-200">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={
              "border-b-2 px-1 pb-2 text-sm font-medium transition-colors " +
              (tab === tb.key
                ? "border-dolphin-600 text-dolphin-700"
                : "border-transparent text-slate-400 hover:text-slate-600")
            }
          >
            {tb.label}
          </button>
        ))}
      </div>

      {!current ? (
        <div className="mt-5 text-center">
          <p className="text-sm text-slate-500">{t.message.noDraftYet(channelLabel)}</p>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => generateDraftAction(signalId, tab))}
            className="mt-3 rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
          >
            {t.message.generateDraft}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tab === "email" && (
            <div>
              <label className="text-xs font-medium text-slate-500">{t.message.subject}</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-500">{t.message.messageLabel}</label>
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={10}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-ink focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={isPending}
              onClick={handleSave}
              className="rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {saved ? t.message.saved : t.message.saveDraft}
            </button>
            <button
              onClick={handleCopy}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              {copied ? t.message.copied : t.message.copyMessage}
            </button>
            <button
              disabled={isPending}
              onClick={() => startTransition(() => generateDraftAction(signalId, tab))}
              className="text-xs font-medium text-slate-500 hover:text-dolphin-600"
            >
              {t.message.generateAnother}
            </button>
          </div>

          <p className="text-xs text-slate-400">{t.message.manualNote(channelLabel)}</p>

          {current.status === "pendiente_aprobacion" && (
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button
                disabled={isPending}
                onClick={() => startTransition(() => approveMessageAction(current.id, signalId))}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {t.message.approve}
              </button>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => discardMessageAction(current.id, signalId))}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                {t.message.discard}
              </button>
            </div>
          )}
          {current.status === "aprobado" && (
            <div className="border-t border-slate-100 pt-3">
              <button
                disabled={isPending}
                onClick={() => startTransition(() => markSentAction(current.id, signalId))}
                className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
              >
                {t.message.markSent}
              </button>
            </div>
          )}
        </div>
      )}

      {messages.length > 1 && (
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
          {t.message.draftCount(messages.length)}
        </p>
      )}
    </div>
  );
}
