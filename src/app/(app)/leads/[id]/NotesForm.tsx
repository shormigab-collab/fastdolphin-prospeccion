"use client";

import { useRef, useState, useTransition } from "react";
import { addNoteAction } from "./actions";
import type { Note } from "@/lib/types";

export function NotesForm({ signalId, notes }: { signalId: string; notes: Note[] }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Notas de seguimiento
      </h2>

      <div className="mt-3 space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-slate-400">Sin notas todavía.</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <div className="text-xs text-slate-400">
              {new Date(n.created_at).toLocaleString("es-CO")}
            </div>
            <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
          </div>
        ))}
      </div>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const body = value;
          setValue("");
          startTransition(() => addNoteAction(signalId, body));
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Agregar una nota..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
        />
        <button
          disabled={isPending || !value.trim()}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}
