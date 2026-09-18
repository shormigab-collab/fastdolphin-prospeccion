"use client";

import { useTransition } from "react";
import { confirmVacancyAction } from "./actions";
import { IconCheck } from "@/components/icons";

export function ConfirmVacancyButton({
  signalId,
  confirmedAt,
}: {
  signalId: string;
  confirmedAt: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (confirmedAt) {
    const date = new Date(confirmedAt).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <IconCheck className="h-3.5 w-3.5" />
        Vacante confirmada el {date}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => confirmVacancyAction(signalId))}
      title="Marca esta señal como una vacante que verificaste que existe de verdad. Sube la prioridad a alta y avisa al equipo por correo, si el envío de correos está configurado."
      className="inline-flex items-center gap-1.5 rounded-xl border border-dolphin-200 bg-white px-3 py-1.5 text-xs font-semibold text-dolphin-700 shadow-card hover:bg-dolphin-50 disabled:opacity-60"
    >
      <IconCheck className="h-3.5 w-3.5" />
      {isPending ? "Confirmando..." : "Confirmar vacante"}
    </button>
  );
}
