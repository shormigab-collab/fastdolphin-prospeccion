import Link from "next/link";
import { listSignals, listRecentActivity } from "@/lib/queries";
import { StatusBadge, TechBadge, SourceBadge } from "@/components/Badges";
import { IconTarget } from "@/components/icons";
import { RecentActivity } from "./RecentActivity";

type View = "todas" | "alta" | "sin_contactar";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const [all, activity] = await Promise.all([
    listSignals(),
    listRecentActivity({ range: "today", limit: 12 }),
  ]);

  const view: View =
    searchParams.view === "alta" || searchParams.view === "sin_contactar"
      ? (searchParams.view as View)
      : "todas";

  const nuevos = all.filter((s) => s.status === "nuevo").length;
  const enProceso = all.filter((s) =>
    ["calificando", "contactado", "en_conversacion"].includes(s.status)
  ).length;
  // Reuniones agendadas y oportunidades ganadas son cosas distintas — antes
  // se contaban juntas en esta tarjeta, ahora cada una se mide por separado.
  const reunionAgendada = all.filter((s) => s.status === "reunion_agendada").length;
  const ganadas = all.filter((s) => s.status === "ganado").length;
  const altaPrioridad = all.filter(
    (s) => s.priority === "alta" && s.status !== "descartado"
  ).length;

  const byTech = all.reduce<Record<string, number>>((acc, s) => {
    acc[s.technology] = (acc[s.technology] ?? 0) + 1;
    return acc;
  }, {});
  const maxTech = Math.max(1, ...Object.values(byTech));

  const filtered =
    view === "alta"
      ? all.filter((s) => s.priority === "alta" && s.status !== "descartado")
      : view === "sin_contactar"
        ? all.filter((s) => s.status === "nuevo")
        : all;
  const prioritarias = filtered.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <p className="text-xs font-medium text-slate-400">Prospección / Resumen</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tu radar de oportunidades</h1>
          <p className="mt-1 text-sm text-slate-500">
            Prioriza las señales que pueden convertirse en tu próxima conversación.
          </p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-dolphin-700"
        >
          + Cargar señal
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Señales nuevas" value={nuevos} />
        <Stat label="En proceso" value={enProceso} />
        <Stat label="Reunión agendada" value={reunionAgendada} sub={ganadas > 0 ? `${ganadas} ganada${ganadas === 1 ? "" : "s"}` : undefined} />
        <Stat label="Prioridad alta" value={altaPrioridad} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2" id="oportunidades">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Oportunidades prioritarias
            </h2>
            <div className="flex gap-2">
              <ViewLink label="Todas" view="todas" active={view === "todas"} />
              <ViewLink label="Alta prioridad" view="alta" active={view === "alta"} />
              <ViewLink label="Sin contactar" view="sin_contactar" active={view === "sin_contactar"} />
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Empresa / Señal</th>
                  <th className="px-4 py-3">Tecnología</th>
                  <th className="px-4 py-3">Fuente</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prioritarias.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.priority === "alta" && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-dolphin-600" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink">
                            {s.company?.name ?? "Empresa sin nombre"}
                          </div>
                          <div className="truncate text-xs text-slate-400">{s.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TechBadge technology={s.technology} />
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={s.source} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/leads/${s.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {prioritarias.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay señales con este filtro todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Por tecnología
            </h2>
            <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              {Object.entries(byTech).length === 0 && (
                <p className="text-sm text-slate-500">Sin datos todavía.</p>
              )}
              {Object.entries(byTech)
                .sort((a, b) => b[1] - a[1])
                .map(([tech, count]) => (
                  <div key={tech}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">{tech}</span>
                      <span className="font-semibold text-slate-500">{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-dolphin-600"
                        style={{ width: `${Math.max(6, (count / maxTech) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-2xl border border-dolphin-100 bg-dolphin-50 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-dolphin-600 shadow-card">
              <IconTarget className="h-[18px] w-[18px]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink">Siguiente paso</h3>
            <p className="mt-1 text-sm text-slate-600">
              {altaPrioridad > 0
                ? `Revisa las ${altaPrioridad} oportunidad${altaPrioridad === 1 ? "" : "es"} de prioridad alta.`
                : "No hay oportunidades de prioridad alta pendientes ahora mismo."}
            </p>
            {altaPrioridad > 0 && (
              <Link
                href="/dashboard?view=alta#oportunidades"
                className="mt-4 inline-block rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dolphin-700"
              >
                Revisar oportunidades
              </Link>
            )}
          </div>
        </div>
      </div>

      <RecentActivity initialItems={activity} />
    </div>
  );
}


function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="text-3xl font-bold text-ink">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function ViewLink({ label, view, active }: { label: string; view: View; active: boolean }) {
  return (
    <Link
      href={view === "todas" ? "/dashboard" : `/dashboard?view=${view}`}
      className={
        "rounded-full border px-3 py-1 text-xs font-medium " +
        (active
          ? "border-dolphin-600 bg-dolphin-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
      }
    >
      {label}
    </Link>
  );
}
