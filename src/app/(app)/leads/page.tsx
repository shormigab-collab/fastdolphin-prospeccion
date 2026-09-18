import Link from "next/link";
import { listSignals } from "@/lib/queries";
import { StatusBadge, TechBadge, PriorityBadge, SourceBadge } from "@/components/Badges";
import type { SignalStatus, Technology } from "@/lib/types";

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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string; technology?: string };
}) {
  const signals = await listSignals({
    status: searchParams.status as SignalStatus | undefined,
    technology: searchParams.technology as Technology | undefined,
  });

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Señales / Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            {signals.length} señales encontradas
          </p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-md bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dolphin-700"
        >
          + Cargar de LinkedIn
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterLink
          label="Todos los estados"
          href="/leads"
          active={!searchParams.status}
        />
        {ALL_STATUSES.map((status) => (
          <FilterLink
            key={status}
            label={status.replace("_", " ")}
            href={`/leads?status=${status}${searchParams.technology ? `&technology=${searchParams.technology}` : ""}`}
            active={searchParams.status === status}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterLink
          label="Todas las tecnologías"
          href={searchParams.status ? `/leads?status=${searchParams.status}` : "/leads"}
          active={!searchParams.technology}
          variant="tech"
        />
        {ALL_TECH.map((tech) => (
          <FilterLink
            key={tech}
            label={tech}
            href={`/leads?technology=${tech}${searchParams.status ? `&status=${searchParams.status}` : ""}`}
            active={searchParams.technology === tech}
            variant="tech"
          />
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Señal</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Tecnología</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {signals.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${s.id}`} className="font-medium text-dolphin-700 hover:underline">
                    {s.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.company?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <TechBadge technology={s.technology} />
                </td>
                <td className="px-4 py-3">
                  <SourceBadge source={s.source} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={s.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {signals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay señales con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
  variant = "status",
}: {
  label: string;
  href: string;
  active: boolean;
  variant?: "status" | "tech";
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1 text-xs font-medium capitalize " +
        (active
          ? variant === "tech"
            ? "border-dolphin-600 bg-dolphin-600 text-white"
            : "border-slate-800 bg-slate-800 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
      }
    >
      {label}
    </Link>
  );
}
