"use client";

import { useTransition } from "react";
import { updateStatusAction } from "./actions";
import type { SignalStatus } from "@/lib/types";

const STATUSES: SignalStatus[] = [
  "nuevo",
  "calificando",
  "contactado",
  "en_conversacion",
  "reunion_agendada",
  "ganado",
  "descartado",
];

export function StatusForm({
  signalId,
  status,
}: {
  signalId: string;
  status: SignalStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => {
          updateStatusAction(signalId, e.target.value as SignalStatus);
        })
      }
      className="rounded-md border border-slate-300 px-3 py-2 text-sm capitalize focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
