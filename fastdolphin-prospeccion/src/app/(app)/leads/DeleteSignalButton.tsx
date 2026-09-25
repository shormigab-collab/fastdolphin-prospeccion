"use client";

import { useTransition } from "react";
import { deleteSignalAction } from "./actions";
import { IconTrash } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";

export function DeleteSignalButton({ signalId, title }: { signalId: string; title: string }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(t.leads.deleteConfirm(title))) return;
    startTransition(() => {
      deleteSignalAction(signalId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={t.leads.deleteAction}
      aria-label={t.leads.deleteAction}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <IconTrash className="h-4 w-4" />
    </button>
  );
}
