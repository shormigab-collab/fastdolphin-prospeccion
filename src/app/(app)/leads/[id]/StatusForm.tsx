"use client";

import { useTransition } from "react";
import { updateStatusAction } from "./actions";
import { IconChevronDown } from "@/components/icons";
import { statusLabels } from "@/components/Badges";
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
    <div className="relative">
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() => {
            updateStatusAction(signalId, e.target.value as SignalStatus);
          })
        }
        className="appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-ink shadow-card focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500 disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s]}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
