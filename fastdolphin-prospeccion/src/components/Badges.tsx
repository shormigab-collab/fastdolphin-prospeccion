import clsx from "clsx";
import type { SignalPriority, SignalStatus, SignalSource, WorkMode } from "@/lib/types";
import { dict, type Lang } from "@/lib/i18n";

// Todas las badges reciben `lang` como prop opcional (por defecto "es") en
// vez de leer el contexto de idioma directamente — así funcionan igual
// dentro de Server Components (que no pueden usar hooks de React) y dentro
// de componentes de cliente, según quién las use.

const statusStyles: Record<SignalStatus, string> = {
  nuevo: "bg-blue-50 text-blue-700",
  calificando: "bg-amber-50 text-amber-700",
  contactado: "bg-purple-50 text-purple-700",
  en_conversacion: "bg-indigo-50 text-indigo-700",
  reunion_agendada: "bg-emerald-50 text-emerald-700",
  ganado: "bg-green-100 text-green-800",
  descartado: "bg-slate-100 text-slate-500",
};

export function statusLabel(status: SignalStatus, lang: Lang = "es") {
  return dict[lang].status[status];
}

export function StatusBadge({ status, lang = "es" }: { status: SignalStatus; lang?: Lang }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {statusLabel(status, lang)}
    </span>
  );
}

const statusDotStyles: Record<SignalStatus, string> = {
  nuevo: "bg-violet-500 text-violet-700",
  calificando: "bg-amber-500 text-amber-700",
  contactado: "bg-sky-500 text-sky-700",
  en_conversacion: "bg-emerald-500 text-emerald-700",
  reunion_agendada: "bg-teal-500 text-teal-700",
  ganado: "bg-green-600 text-green-700",
  descartado: "bg-slate-400 text-slate-500",
};

// Variante "punto + texto" (sin fondo de pastilla) para la tabla de
// Oportunidades — StatusBadge (arriba) sigue igual en todos los demás
// lugares que ya la usaban.
export function StatusDot({ status, lang = "es" }: { status: SignalStatus; lang?: Lang }) {
  const [dot, text] = statusDotStyles[status].split(" ");
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-sm font-medium", text)}>
      <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      {statusLabel(status, lang)}
    </span>
  );
}

const priorityStyles: Record<SignalPriority, string> = {
  alta: "bg-red-50 text-red-700",
  media: "bg-amber-50 text-amber-700",
  baja: "bg-slate-100 text-slate-500",
};

export function PriorityBadge({ priority, lang = "es" }: { priority: SignalPriority; lang?: Lang }) {
  const t = dict[lang];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        priorityStyles[priority]
      )}
    >
      {t.priority.prefix} {t.priority[priority]}
    </span>
  );
}

// originLabel es de dónde salió de verdad (LinkedIn, Indeed, Computrabajo,
// página de la empresa...) para las señales cargadas a mano — antes se
// asumía que siempre era LinkedIn, ahora se puede elegir. Se guarda tal
// cual la escribió la persona, así que no se traduce.
export function SourceBadge({
  source,
  originLabel,
  lang = "es",
}: {
  source: SignalSource;
  originLabel?: string | null;
  lang?: Lang;
}) {
  const t = dict[lang];
  const label = source === "linkedin_import" && originLabel ? originLabel : t.source[source];
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

// Los nombres de tecnología (SAP, Oracle, Cloud/DevOps...) son los mismos
// en ambos idiomas — son el vocabulario del stack, no texto de interfaz.
export function TechBadge({ technology }: { technology: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-dolphin-50 px-2.5 py-0.5 text-xs font-semibold text-dolphin-700">
      {technology}
    </span>
  );
}

const workModeStyles: Record<WorkMode, string> = {
  remoto: "bg-teal-50 text-teal-700",
  hibrido: "bg-sky-50 text-sky-700",
  presencial: "bg-orange-50 text-orange-700",
};

export function WorkModeBadge({
  workMode,
  location,
  lang = "es",
}: {
  workMode: WorkMode;
  location?: string | null;
  lang?: Lang;
}) {
  const t = dict[lang];
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        workModeStyles[workMode]
      )}
    >
      {t.workMode[workMode]}
      {location ? ` · ${location}` : ""}
    </span>
  );
}

// "Posible nearshore" — nunca "Nearshore" a secas, porque no es un dato que
// Adzuna/RemoteOK/Remotive confirmen: es una coincidencia de palabras clave
// en el título/ubicación/descripción original de la vacante (ver
// @/lib/nearshore). El `title` deja esa aclaración a mano en la interfaz,
// no solo en el código.
export function NearshoreBadge({ lang = "es" }: { lang?: Lang }) {
  const t = dict[lang];
  return (
    <span
      title={t.leads.nearshoreBadgeTitle}
      className="inline-flex shrink-0 items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700"
    >
      {t.leads.nearshoreBadge}
    </span>
  );
}
