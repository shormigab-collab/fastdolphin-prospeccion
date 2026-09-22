import Link from "next/link";
import { listSignals, listRecentActivity } from "@/lib/queries";
import { StatusBadge, TechBadge, SourceBadge } from "@/components/Badges";
import { IconTarget } from "@/components/icons";
import { RecentActivity } from "./RecentActivity";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/getLang";

type View = "todas" | "alta" | "sin_contactar";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const lang = getLang();
  const t = getDict(lang);

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-xs font-medium text-slate-400">{t.dashboard.breadcrumb}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.dashboard.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.dashboard.subtitle}</p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-dolphin-700"
        >
          {t.dashboard.loadSignal}
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t.dashboard.statNew} value={nuevos} />
        <Stat label={t.dashboard.statInProgress} value={enProceso} />
        <Stat
          label={t.dashboard.statMeeting}
          value={reunionAgendada}
          sub={ganadas > 0 ? t.dashboard.statWon(ganadas) : undefined}
        />
        <Stat label={t.dashboard.statHighPriority} value={altaPrioridad} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2" id="oportunidades">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t.dashboard.priorityOpportunities}
            </h2>
            <div className="flex gap-2">
              <ViewLink label={t.dashboard.viewAll} view="todas" active={view === "todas"} />
              <ViewLink label={t.dashboard.viewHighPriority} view="alta" active={view === "alta"} />
              <ViewLink
                label={t.dashboard.viewUncontacted}
                view="sin_contactar"
                active={view === "sin_contactar"}
              />
            </div>
          </div>

          {/* Tabla — desde tablet/desktop (md+) */}
          <div className="mt-3 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t.dashboard.colCompanySignal}</th>
                    <th className="px-4 py-3">{t.dashboard.colTechnology}</th>
                    <th className="px-4 py-3">{t.dashboard.colSource}</th>
                    <th className="px-4 py-3">{t.dashboard.colStatus}</th>
                    <th className="px-4 py-3 text-right">{t.dashboard.colAction}</th>
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
                              {s.company?.name ?? t.dashboard.unnamedCompany}
                            </div>
                            <div className="truncate text-xs text-slate-400">{s.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TechBadge technology={s.technology} />
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge source={s.source} lang={lang} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} lang={lang} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/leads/${s.id}`}
                          className="inline-block whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
                        >
                          {t.dashboard.viewDetail}
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {prioritarias.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        {t.dashboard.noSignalsFilter}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tarjetas — solo en móvil */}
          <div className="mt-3 space-y-3 md:hidden">
            {prioritarias.map((s) => (
              <Link
                key={s.id}
                href={`/leads/${s.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-card hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  {s.priority === "alta" && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-dolphin-600" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">
                      {s.company?.name ?? t.dashboard.unnamedCompany}
                    </div>
                    <div className="truncate text-xs text-slate-400">{s.title}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <TechBadge technology={s.technology} />
                  <SourceBadge source={s.source} lang={lang} />
                  <StatusBadge status={s.status} lang={lang} />
                </div>
              </Link>
            ))}
            {prioritarias.length === 0 && (
              <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-card">
                {t.dashboard.noSignalsFilter}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t.dashboard.byTechnology}
            </h2>
            <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              {Object.entries(byTech).length === 0 && (
                <p className="text-sm text-slate-500">{t.dashboard.noDataYet}</p>
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
            <h3 className="mt-3 text-sm font-semibold text-ink">{t.dashboard.nextStep}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {altaPrioridad > 0
                ? t.dashboard.nextStepWithHigh(altaPrioridad)
                : t.dashboard.nextStepNoHigh}
            </p>
            {altaPrioridad > 0 && (
              <Link
                href="/dashboard?view=alta#oportunidades"
                className="mt-4 inline-block rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dolphin-700"
              >
                {t.dashboard.reviewOpportunities}
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
