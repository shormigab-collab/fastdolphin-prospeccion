import Link from "next/link";
import { listSignals } from "@/lib/queries";
import { StatusBadge, TechBadge, PriorityBadge, SourceBadge, WorkModeBadge } from "@/components/Badges";
import { matchesLocationPolicy } from "@/lib/policy";
import { IconSearch, IconCheck } from "@/components/icons";
import { LeadsFilters } from "./LeadsFilters";
import { DeleteSignalButton } from "./DeleteSignalButton";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/getLang";
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
  const lang = getLang();
  const t = getDict(lang);

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-xs font-medium text-slate-400">{t.leads.breadcrumb}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.leads.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.leads.countFound(signals.length)}
            {!showAll && hiddenCount > 0 && (
              <>
                {" · "}
                <Link
                  href={buildHref(base, { all: "1" })}
                  className="text-dolphin-600 hover:underline"
                >
                  {t.leads.hiddenLink(hiddenCount)}
                </Link>
              </>
            )}
            {showAll && (
              <>
                {" · "}
                <Link href={buildHref(base, { all: undefined })} className="text-dolphin-600 hover:underline">
                  {t.leads.hideOutOfPolicy}
                </Link>
              </>
            )}
          </p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-dolphin-700"
        >
          {t.leads.loadVacancy}
        </Link>
      </div>

      <p className="mt-2 text-xs text-slate-500">{t.leads.policyNote}</p>

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
            placeholder={t.leads.searchPlaceholder}
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90"
        >
          {t.leads.search}
        </button>
        {searchParams.q && (
          <Link
            href={buildHref(base, { q: undefined })}
            className="text-xs font-medium text-slate-500 hover:text-dolphin-600 hover:underline"
          >
            {t.leads.clearSearch}
          </Link>
        )}
      </form>

      <div className="mt-4">
        <LeadsFilters current={base} />
      </div>

      {/* Tabla completa — solo desde tablet/desktop (md+). En pantallas más
          angostas la lee mejor como tarjetas apiladas (ver abajo). */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t.leads.colSignal}</th>
                <th className="px-4 py-3">{t.leads.colCompany}</th>
                <th className="px-4 py-3">{t.leads.colTechnology}</th>
                <th className="px-4 py-3">{t.leads.colSource}</th>
                <th className="px-4 py-3">{t.leads.colWorkMode}</th>
                <th className="px-4 py-3">{t.leads.colPriority}</th>
                <th className="px-4 py-3">{t.leads.colStatus}</th>
                <th className="px-4 py-3">
                  <span className="sr-only">{t.leads.colActions}</span>
                </th>
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
                    <SourceBadge source={s.source} originLabel={s.origin_label} lang={lang} />
                  </td>
                  <td className="px-4 py-3">
                    <WorkModeBadge workMode={s.work_mode} location={s.location} lang={lang} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={s.priority} lang={lang} />
                      {s.vacancy_confirmed_at && (
                        <span title={t.leads.confirmedTitle} className="text-emerald-600">
                          <IconCheck className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} lang={lang} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteSignalButton signalId={s.id} title={s.title} />
                  </td>
                </tr>
              ))}
              {signals.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {t.leads.noSignalsFilters}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjetas — solo en móvil (md:hidden), mismos datos que la tabla
          pero apilados para no tener que hacer scroll horizontal. */}
      <div className="mt-6 space-y-3 md:hidden">
        {signals.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/leads/${s.id}`}
                className="font-medium text-dolphin-700 hover:underline"
              >
                {s.title}
              </Link>
              <DeleteSignalButton signalId={s.id} title={s.title} />
            </div>
            <div className="mt-0.5 text-sm text-slate-600">{s.company?.name ?? "—"}</div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <TechBadge technology={s.technology} />
              <SourceBadge source={s.source} originLabel={s.origin_label} lang={lang} />
              <WorkModeBadge workMode={s.work_mode} location={s.location} lang={lang} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={s.priority} lang={lang} />
              {s.vacancy_confirmed_at && (
                <span title={t.leads.confirmedTitle} className="text-emerald-600">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
              )}
              <StatusBadge status={s.status} lang={lang} />
            </div>
          </div>
        ))}
        {signals.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-card">
            {t.leads.noSignalsFilters}
          </p>
        )}
      </div>
    </div>
  );
}
