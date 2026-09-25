"use client";

import { useTransition } from "react";
import { confirmVacancyAction } from "./actions";
import { IconCheck } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";

export function ConfirmVacancyButton({
  signalId,
  confirmedAt,
}: {
  signalId: string;
  confirmedAt: string | null;
}) {
  const { t, lang } = useLanguage();
  const [isPending, startTransition] = useTransition();

  if (confirmedAt) {
    const date = new Date(confirmedAt).toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <IconCheck className="h-3.5 w-3.5" />
        {t.leadDetail.confirmedOn(date)}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => confirmVacancyAction(signalId))}
      title={t.leadDetail.confirmVacancyTitle}
      className="inline-flex items-center gap-1.5 rounded-xl border border-dolphin-200 bg-white px-3 py-1.5 text-xs font-semibold text-dolphin-700 shadow-card hover:bg-dolphin-50 disabled:opacity-60"
    >
      <IconCheck className="h-3.5 w-3.5" />
      {isPending ? t.leadDetail.confirming : t.leadDetail.confirmVacancy}
    </button>
  );
}
