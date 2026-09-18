import clsx from "clsx";
import type { SignalPriority, SignalStatus, SignalSource, WorkMode } from "@/lib/types";

const statusStyles: Record<SignalStatus, string> = {
  nuevo: "bg-blue-50 text-blue-700",
  calificando: "bg-amber-50 text-amber-700",
  contactado: "bg-purple-50 text-purple-700",
  en_conversacion: "bg-indigo-50 text-indigo-700",
  reunion_agendada: "bg-emerald-50 text-emerald-700",
  ganado: "bg-green-100 text-green-800",
  descartado: "bg-slate-100 text-slate-500",
};

const statusLabels: Record<SignalStatus, string> = {
  nuevo: "Nuevo",
  calificando: "Calificando",
  contactado: "Contactado",
  en_conversacion: "En conversación",
  reunion_agendada: "Reunión agendada",
  ganado: "Ganado",
  descartado: "Descartado",
};

export function StatusBadge({ status }: { status: SignalStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

const priorityStyles: Record<SignalPriority, string> = {
  alta: "bg-red-50 text-red-700",
  media: "bg-amber-50 text-amber-700",
  baja: "bg-slate-100 text-slate-500",
};

export function PriorityBadge({ priority }: { priority: SignalPriority }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        priorityStyles[priority]
      )}
    >
      Prioridad {priority}
    </span>
  );
}

const sourceLabels: Record<SignalSource, string> = {
  apollo: "Apollo.io",
  manual: "Cargado manual",
  linkedin_import: "Import. LinkedIn",
};

export function SourceBadge({ source }: { source: SignalSource }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {sourceLabels[source]}
    </span>
  );
}

export function TechBadge({ technology }: { technology: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-dolphin-50 px-2.5 py-0.5 text-xs font-semibold text-dolphin-700">
      {technology}
    </span>
  );
}

const workModeLabels: Record<WorkMode, string> = {
  remoto: "Remoto",
  hibrido: "Híbrido",
  presencial: "Presencial",
};

const workModeStyles: Record<WorkMode, string> = {
  remoto: "bg-teal-50 text-teal-700",
  hibrido: "bg-sky-50 text-sky-700",
  presencial: "bg-orange-50 text-orange-700",
};

export function WorkModeBadge({
  workMode,
  location,
}: {
  workMode: WorkMode;
  location?: string | null;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        workModeStyles[workMode]
      )}
    >
      {workModeLabels[workMode]}
      {location ? ` · ${location}` : ""}
    </span>
  );
}
