"use client";

import { useState, useTransition } from "react";
import {
  generateDraftAction,
  approveMessageAction,
  markSentAction,
  discardMessageAction,
} from "./actions";
import type { MessageDraft } from "@/lib/types";

const statusLabel: Record<MessageDraft["status"], string> = {
  pendiente_aprobacion: "Pendiente de aprobación",
  aprobado: "Aprobado — listo para enviar",
  enviado: "Enviado",
  descartado: "Descartado",
};

export function MessagePanel({
  signalId,
  messages,
}: {
  signalId: string;
  messages: MessageDraft[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Record<string, string>>({});

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Mensaje de outreach
        </h2>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => generateDraftAction(signalId))}
          className="rounded-md bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
        >
          + Generar borrador sugerido
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Ningún mensaje se envía automáticamente. Cada borrador debe ser
        revisado y aprobado por una persona del equipo antes de mandarse
        manualmente por LinkedIn o correo.
      </p>

      <div className="mt-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Todavía no hay un borrador para esta señal.
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className="rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                {statusLabel[m.status]} · {m.channel === "linkedin" ? "LinkedIn" : "Correo"}
              </span>
              <span className="text-slate-400">
                {new Date(m.created_at).toLocaleDateString("es-CO")}
              </span>
            </div>
            <textarea
              value={editing[m.id] ?? m.draft_text}
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, [m.id]: e.target.value }))
              }
              rows={6}
              className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            />
            {m.status === "pendiente_aprobacion" && (
              <div className="mt-3 flex gap-2">
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => approveMessageAction(m.id, signalId))
                  }
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Aprobar
                </button>
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => discardMessageAction(m.id, signalId))
                  }
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  Descartar
                </button>
              </div>
            )}
            {m.status === "aprobado" && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => markSentAction(m.id, signalId))
                  }
                  className="rounded-md bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
                >
                  Ya lo envié manualmente — marcar como enviado
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
