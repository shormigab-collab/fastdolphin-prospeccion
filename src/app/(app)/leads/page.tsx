import Link from "next/link";
import { auth } from "@/auth";
import { listSignals, listUsers } from "@/lib/queries";
import { groupSignalsByCompany } from "@/lib/groupSignals";
import { matchesLocationPolicy } from "@/lib/policy";
import { IconSearch, IconShield } from "@/components/icons";
import { LeadsFilters } from "./LeadsFilters";
import { LeadsTable } from "./LeadsTable";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/getLang";
import type { SignalStatus, SignalPriority, Technology, SignalSource, WorkMode } from "@/lib/types";

type LeadsSearchParams = {
  status?: string;
  technology?: string;
  priority?: string;
  source?: string;
  workMode?: string;
  assignedTo?: string;
  q?: string;
  all?: string;
  overdue?: string;
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
  if (merged.source) usp.set("source", merged.source);
  if (merged.workMode) usp.set("workMode", merged.workMode);
  if (merged.assignedTo) usp.set("assignedTo", merged.assignedTo);
  if (merged.q) usp.set("q", merged.q);
  if (merged.all) usp.set("all", merged.all);
  if (merged.overdue) usp.set("overdue", merged.overdue);
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
  const session = await auth();
  const myId = session?.user?.id ?? null;

  // El filtro de fuente admite varias a la vez (ej. Apollo + Adzuna) —
  // viajan por la URL como una sola lista separada por comas ("apollo,adzuna").
  const sourceValues = searchParams.source
    ? (searchParams.source.split(",").filter(Boolean) as SignalSource[])
    : undefined;

  const [allSignals, users] = await Promise.all([
    listSignals({
      status: searchParams.status as SignalStatus | undefined,
      technology: searchParams.technology as Technology | undefined,
      priority: searchParams.priority as SignalPriority | undefined,
      sources: sourceValues,
      workMode: searchParams.workMode as WorkMode | undefined,
      assignedTo: searchParams.assignedTo,
      q: searchParams.q,
      overdueOnly: searchParams.overdue === "1",
    }),
    listUsers(),
  ]);

  const showAll = searchParams.all === "1";
  const policySignals = showAll
    ? allSignals
    : allSignals.filter((s) => matchesLocationPolicy(s.work_mode, s.location));
  const hiddenCount = allSignals.length - policySignals.length;

  const signals = policySignals;

  const base: LeadsSearchParams = {
    status: searchParams.status,
    technology: searchParams.technology,
    priority: searchParams.priority,
    source: searchParams.source,
    workMode: searchParams.workMode,
    assignedTo: searchParams.assignedTo,
    q: searchParams.q,
    all: searchParams.all,
    overdue: searchParams.overdue,
  };

  const groups = groupSignalsByCompany(signals);

  const isMine = !!myId && searchParams.assignedTo === myId;
  const isUnassigned = searchParams.assignedTo === "unassigned";
  const isOverdue = searchParams.overdue === "1";
  const isDefaultTab = !searchParams.assignedTo && !isOverdue;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-xs font-medium text-slate-400">{t.leads.breadcrumb}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t.leads.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.leads.subtitle}</p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-dolphin-700"
        >
          {t.leads.loadVacancy}
        </Link>
      </div>

      <form action="/leads" method="GET" className="mt-6 flex flex-wrap items-center gap-2">
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        {searchParams.technology && (
          <input type="hidden" name="technology" value={searchParams.technology} />
        )}
        {searchParams.priority && <input type="hidden" name="priority" value={searchParams.priority} />}
        {searchParams.source && <input type="hidden" name="source" value={searchParams.source} />}
        {searchParams.workMode && <input type="hidden" name="workMode" value={searchParams.workMode} />}
        {searchParams.assignedTo && (
          <input type="hidden" name="assignedTo" value={searchParams.assignedTo} />
        )}
        {searchParams.all && <input type="hidden" name="all" value={searchParams.all} />}
        {searchParams.overdue && <input type="hidden" name="overdue" value={searchParams.overdue} />}
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
        <LeadsFilters current={base} users={users} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <QuickTab
            label={t.leads.tabAll}
            active={isDefaultTab}
            href={buildHref(base, { assignedTo: undefined, overdue: undefined })}
          />
          {myId && (
            <QuickTab
              label={t.leads.tabMine}
              active={isMine}
              href={buildHref(base, { assignedTo: myId, overdue: undefined })}
            />
          )}
          <QuickTab
            label={t.leads.tabUnassigned}
            active={isUnassigned}
            href={buildHref(base, { assignedTo: "unassigned", overdue: undefined })}
          />
          <QuickTab
            label={t.leads.tabOverdue}
            active={isOverdue}
            href={buildHref(base, { assignedTo: undefined, overdue: "1" })}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {hiddenCount > 0 && !showAll && (
            <Link
              href={buildHref(base, { all: "1" })}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
              title={t.leads.hiddenLink(hiddenCount)}
            >
              <IconShield className="h-3.5 w-3.5" />
              {t.leads.policyApplied}
            </Link>
          )}
          {showAll && (
            <Link href={buildHref(base, { all: undefined })} className="text-dolphin-600 hover:underline">
              {t.leads.hideOutOfPolicy}
            </Link>
          )}
          <span>{t.leads.countCompanies(groups.length)}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">{t.leads.policyNote}</p>

      <div className="mt-4">
        <LeadsTable groups={groups} users={users} noSignalsLabel={t.leads.noSignalsFilters} />
      </div>
    </div>
  );
}

function QuickTab({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1.5 text-xs font-medium " +
        (active
          ? "border-dolphin-600 bg-dolphin-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
      }
    >
      {label}
    </Link>
  );
}
