import Link from "next/link";
import { listSignals } from "@/lib/queries";
import { StatusBadge, TechBadge, PriorityBadge, SourceBadge, WorkModeBadge } from "@/components/Badges";
import { matchesLocationPolicy } from "@/lib/policy";
import { IconSearch, IconCheck } from "@/components/icons";
import { LeadsFilters } from "./LeadsFilters";
import type { SignalStatus, SignalPriority, Technology } from "@/lib/types";

type LeadsSearchParams = {
  status?: string;
  technology?: string;
  priority?: string;
  q?: string;
  all?: string;
};

// Arma un href de /leads a partir de los filtros actuales, reemplazando
// (o quitando, si el valor es undefined) uno o varios de ellos — así cada
// filtro se puede combinar con los demás sin perderlos al hacer clic.
function buildHref(base: LeadsSearchParams, overrides: LeadsSearchParams) {
  const merged = { ...base, ...overrides };
  const usp = new URLSearchParams();
  if (merged.status) usp.set("status", merged.status);
  if (merged.technology) usp.set("technology", merged.technology);
  if (merged.priority) usp.set("priority", merged.priority);
  if (merged.q) usp.set("q", merged.q);
  if (merged.all) usp.set("all", merged.all);
  const s = usp.toString();
  return s ? `/leads?${s}` : "/leads";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: LeadsSearchParams;
}) {
  const allSignals = await listSignals({
    status: searchParams.status as SignalStatus | undefined,
    technology: searchParams.technology as Technology | undefined,
    priority: searchParams.priority as SignalPriority | undefined,
    q: searchParams.q,
  });

  const showAll = searchParams.all === "1";
  const signals = showAll
    ? allSignals
    : allSignals.filter((s) => matchesLocationPolicy(s.work_mode, s.location));
  const hiddenCount = allSignals.length - signals.length;

  const base: LeadsSearchParams = {
    status: searchParams.status,
    technology: searchParams.technology,
    priority: searchParams.priority,
    q: searchParams.q,
    all: searchParams.all,
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <p className="text-xs font-medium text-slate-400">Prospección / Señales</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Señales / Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            {signals.length} señales encontradas
            {!showAll && hiddenCount > 0 && (
              <>
                {" · "}
                <Link
                  href={buildHref(base, { all: "1" })}
                  className="text-dolphin-600 hover:underline"
                >
                  {hiddenCount} oculta(s) fuera de política (ver todas)
                </Link>
              </>
            )}
            {showAll && (
              <>
                {" · "}
                <Link href={buildHref(base, { all: undefined })} className="text-dolphin-600 hover:underline">
                  ocultar las que están fuera de política
                </Link>
              </>
            )}
          </p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-dolphin-700"
        >
          + Cargar de LinkedIn
        </Link>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Por defecto solo se muestran señales remotas, o presenciales/híbridas en
        México o Brasil — la política de prospección de Fast Dolphin.
      </p>

      <form action="/leads" method="GET" className="mt-6 flex flex-wrap items-center gap-2">
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        {searchParams.technology && (
          <input type="hidden" name="technology" value={searchParams.technology} />
        )}
        {searchParams.priority && <input type="hidden" name="priority" value={searchParams.priority} />}
        {searchParams.all && <input type="hidden" name="all" value={searchParams.all} />}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Buscar por señal o empresa..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90"
        >
          Buscar
        </button>
        {searchParams.q && (
          <Link
            href={buildHref(base, { q: undefined })}
            className="text-xs font-medium text-slate-500 hover:text-dolphin-600 hover:underline"
          >
            Quitar búsqueda
          </Link>
        )}
      </form>

      <div className="mt-4">
        <LeadsFilters current={base} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Señal</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Tecnología</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Modalidad</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {signals.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="max-w-xs px-4 py-3">
                  <Link
                    href={`/leads/${s.id}`}
                    className="font-medium text-dolphin-700 hover:underline"
                    title={s.title}
                  >
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
                  <WorkModeBadge workMode={s.work_mode} location={s.location} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={s.priority} />
                    {s.vacancy_confirmed_at && (
                      <span title="Vacante confirmada" className="text-emerald-600">
                        <IconCheck className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {signals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
