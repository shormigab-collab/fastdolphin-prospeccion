"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconChevronDown } from "@/components/icons";
import { statusLabels } from "@/components/Badges";
import type { SignalStatus, SignalPriority, Technology } from "@/lib/types";

const ALL_STATUSES: SignalStatus[] = [
  "nuevo",
  "calificando",
  "contactado",
  "en_conversacion",
  "reunion_agendada",
  "ganado",
  "descartado",
];

const ALL_TECH: Technology[] = [
  "SAP",
  "Oracle",
  "Salesforce",
  "Cloud/DevOps",
  "Datos/IA",
  "Desarrollo",
  "QA",
  "Ciberseguridad",
  "PM/Consultoría",
];

const PRIORITY_LABELS: Record<SignalPriority, string> = {
  alta: "Prioridad alta",
  media: "Prioridad media",
  baja: "Prioridad baja",
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  ...ALL_STATUSES.map((s) => ({ value: s, label: statusLabels[s] })),
];

const TECH_OPTIONS = [
  { value: "", label: "Todas las tecnologías" },
  ...ALL_TECH.map((t) => ({ value: t, label: t })),
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Todas las prioridades" },
  { value: "alta", label: PRIORITY_LABELS.alta },
  { value: "media", label: PRIORITY_LABELS.media },
  { value: "baja", label: PRIORITY_LABELS.baja },
];

export interface LeadsFilterValues {
  status?: string;
  technology?: string;
  priority?: string;
  q?: string;
  all?: string;
}

export function LeadsFilters({ current }: { current: LeadsFilterValues }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: "status" | "technology" | "priority", value: string) {
    const merged = { ...current, [key]: value || undefined };
    const usp = new URLSearchParams();
    if (merged.status) usp.set("status", merged.status);
    if (merged.technology) usp.set("technology", merged.technology);
    if (merged.priority) usp.set("priority", merged.priority);
    if (merged.q) usp.set("q", merged.q);
    if (merged.all) usp.set("all", merged.all);
    const qs = usp.toString();

    startTransition(() => {
      router.push(qs ? `/leads?${qs}` : "/leads");
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <FilterSelect
        label="Estado"
        value={current.status ?? ""}
        options={STATUS_OPTIONS}
        disabled={isPending}
        onChange={(v) => updateParam("status", v)}
      />
      <FilterSelect
        label="Tecnología"
        value={current.technology ?? ""}
        options={TECH_OPTIONS}
        disabled={isPending}
        onChange={(v) => updateParam("technology", v)}
      />
      <FilterSelect
        label="Prioridad"
        value={current.priority ?? ""}
        options={PRIORITY_OPTIONS}
        disabled={isPending}
        onChange={(v) => updateParam("priority", v)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const isActive = value !== "";

  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={
          "appearance-none rounded-xl border py-2 pl-3 pr-9 text-sm font-medium shadow-card focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500 disabled:opacity-60 " +
          (isActive
            ? "border-dolphin-200 bg-dolphin-50 text-dolphin-700"
            : "border-slate-300 bg-white text-ink")
        }
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        className={
          "pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 " +
          (isActive ? "text-dolphin-500" : "text-slate-400")
        }
      />
    </div>
  );
}
