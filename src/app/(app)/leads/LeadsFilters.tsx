"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconChevronDown } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";
import type { SignalStatus, SignalPriority, Technology, SignalSource, WorkMode } from "@/lib/types";

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

const ALL_SOURCES: SignalSource[] = [
  "apollo",
  "manual",
  "linkedin_import",
  "adzuna",
  "remoteok",
  "remotive",
];

const ALL_WORK_MODES: WorkMode[] = ["remoto", "hibrido", "presencial"];

export interface LeadsFilterValues {
  status?: string;
  technology?: string;
  priority?: string;
  source?: string;
  workMode?: string;
  assignedTo?: string;
  q?: string;
  all?: string;
}

export function LeadsFilters({
  current,
  users,
}: {
  current: LeadsFilterValues;
  users: { id: string; email: string; full_name: string | null }[];
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const assignedToOptions = [
    { value: "", label: t.leads.allAssignedTo },
    { value: "unassigned", label: t.leads.unassigned },
    ...users.map((u) => ({ value: u.id, label: u.full_name ?? u.email })),
  ];

  const statusOptions = [
    { value: "", label: t.leads.allStatuses },
    ...ALL_STATUSES.map((s) => ({ value: s, label: t.status[s] })),
  ];
  const techOptions = [
    { value: "", label: t.leads.allTechnologies },
    ...ALL_TECH.map((tech) => ({ value: tech, label: tech })),
  ];
  const priorityOptions = [
    { value: "", label: t.leads.allPriorities },
    { value: "alta", label: t.leads.priorityHigh },
    { value: "media", label: t.leads.priorityMedium },
    { value: "baja", label: t.leads.priorityLow },
  ];
  const sourceOptions = [
    { value: "", label: t.leads.allSources },
    ...ALL_SOURCES.map((s) => ({ value: s, label: t.source[s] })),
  ];
  const workModeOptions = [
    { value: "", label: t.leads.allWorkModes },
    ...ALL_WORK_MODES.map((w) => ({ value: w, label: t.workMode[w] })),
  ];

  function updateParam(
    key: "status" | "technology" | "priority" | "source" | "workMode" | "assignedTo",
    value: string
  ) {
    const merged = { ...current, [key]: value || undefined };
    const usp = new URLSearchParams();
    if (merged.status) usp.set("status", merged.status);
    if (merged.technology) usp.set("technology", merged.technology);
    if (merged.priority) usp.set("priority", merged.priority);
    if (merged.source) usp.set("source", merged.source);
    if (merged.workMode) usp.set("workMode", merged.workMode);
    if (merged.assignedTo) usp.set("assignedTo", merged.assignedTo);
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
        label={t.leads.filterAssignedTo}
        value={current.assignedTo ?? ""}
        options={assignedToOptions}
        disabled={isPending}
        onChange={(v) => updateParam("assignedTo", v)}
      />
      <FilterSelect
        label={t.leads.filterTechnology}
        value={current.technology ?? ""}
        options={techOptions}
        disabled={isPending}
        onChange={(v) => updateParam("technology", v)}
      />
      <FilterSelect
        label={t.leads.filterStatus}
        value={current.status ?? ""}
        options={statusOptions}
        disabled={isPending}
        onChange={(v) => updateParam("status", v)}
      />
      <FilterSelect
        label={t.leads.filterPriority}
        value={current.priority ?? ""}
        options={priorityOptions}
        disabled={isPending}
        onChange={(v) => updateParam("priority", v)}
      />
      <FilterSelect
        label={t.leads.filterSource}
        value={current.source ?? ""}
        options={sourceOptions}
        disabled={isPending}
        onChange={(v) => updateParam("source", v)}
      />
      <FilterSelect
        label={t.leads.filterWorkMode}
        value={current.workMode ?? ""}
        options={workModeOptions}
        disabled={isPending}
        onChange={(v) => updateParam("workMode", v)}
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
