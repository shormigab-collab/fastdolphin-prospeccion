"use client";

import { useState, useTransition } from "react";
import { markFollowUpDoneAction } from "./actions";
import { IconCalendar, IconAlertTriangle, IconCheck } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";
import { formatDate } from "@/lib/time";

// Solo se muestra cuando la señal tiene un seguimiento REAL programado
// (next_follow_up_at, puesto a propósito desde la barra de acciones en
// lote de Oportunidades) — nunca para las sugerencias (asignar/buscar
// contacto/revisar), que no tienen fecha real que marcar como hecha.
//
// "Marcar seguimiento como hecho" es la única forma de limpiar esa fecha —
// a propósito no se infiere de las notas de texto libre (ver el comentario
// en actions.ts). Al marcarlo, se puede dejar una nota opcional sobre qué
// pasó, que queda registrada en Notas en el mismo paso.
export function FollowUpCard({
  signalId,
  date,
  note,
}: {
  signalId: string;
  date: string;
  note: string | null;
}) {
  const { t, lang } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [addingNote, setAddingNote] = useState(false);
  const [doneNote, setDoneNote] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = date < today;
  const isToday = date === today;
  const color = isOverdue ? "border-red-200 bg-red-50" : isToday ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white";
  const textColor = isOverdue ? "text-red-700" : isToday ? "text-amber-700" : "text-ink";
  const Icon = isOverdue ? IconAlertTriangle : IconCalendar;
  const dateLine = isOverdue
    ? `${t.leads.actionOverdue} · ${formatDate(date, lang)}`
    : isToday
      ? t.leads.actionToday
      : formatDate(date, lang);

  function handleMarkDone() {
    startTransition(() => markFollowUpDoneAction(signalId, doneNote));
  }

  return (
    <div className={`rounded-2xl border p-5 shadow-card ${color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex items-start gap-2 ${textColor}`}>
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{note ?? t.leadDetail.followUpScheduled}</p>
            <p className="mt-0.5 text-xs font-medium opacity-80">{dateLine}</p>
          </div>
        </div>
      </div>

      {!addingNote ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddingNote(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700"
          >
            <IconCheck className="h-3.5 w-3.5" />
            {t.leadDetail.markFollowUpDone}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={doneNote}
            onChange={(e) => setDoneNote(e.target.value)}
            placeholder={t.leadDetail.markFollowUpDoneNotePlaceholder}
            className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkDone}
              className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {isPending ? t.leadDetail.markingFollowUpDone : t.leadDetail.confirmMarkFollowUpDone}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setAddingNote(false);
                setDoneNote("");
              }}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-60"
            >
              {t.contact.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
