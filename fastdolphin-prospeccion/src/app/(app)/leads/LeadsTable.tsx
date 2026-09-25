"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  TechBadge,
  StatusDot,
  StatusBadge,
  SourceBadge,
  WorkModeBadge,
  PriorityBadge,
  NearshoreBadge,
} from "@/components/Badges";
import {
  IconCheck,
  IconChevronRight,
  IconCalendar,
  IconAlertTriangle,
  IconUser,
} from "@/components/icons";
import { DeleteSignalButton } from "./DeleteSignalButton";
import { BulkActionBar } from "./BulkActionBar";
import { nextActionForGroup, type NextActionInfo } from "@/lib/nextAction";
import { distinctTechnologies, type CompanyGroup } from "@/lib/groupSignals";
import { formatDate } from "@/lib/time";

export function LeadsTable({
  groups,
  users,
  noSignalsLabel,
}: {
  groups: CompanyGroup[];
  users: { id: string; email: string; full_name: string | null }[];
  noSignalsLabel: string;
}) {
  const { t, lang } = useLanguage();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const allSignalIds = useMemo(() => groups.flatMap((g) => g.signals.map((s) => s.id)), [groups]);
  const allSelected = allSignalIds.length > 0 && allSignalIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allSignalIds));
  }

  function toggleGroup(group: CompanyGroup) {
    const ids = group.signals.map((s) => s.id);
    const allIn = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function toggleExpand(companyId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(companyId) ? next.delete(companyId) : next.add(companyId);
      return next;
    });
  }

  const selectedIds = Array.from(selected);
  const selectedCompanyCount = groups.filter((g) => g.signals.some((s) => selected.has(s.id))).length;

  return (
    <div>
      {/* Tabla — desde tablet/desktop (md+) */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={t.leads.selectedCount(allSignalIds.length)}
                    className="h-4 w-4 rounded border-slate-300 text-dolphin-600 focus:ring-dolphin-500"
                  />
                </th>
                <th className="min-w-[220px] px-4 py-3">{t.leads.colCompanySignal}</th>
                <th className="min-w-[110px] whitespace-nowrap px-4 py-3">{t.leads.colTechnology}</th>
                <th className="min-w-[150px] whitespace-nowrap px-4 py-3">{t.leads.colResponsible}</th>
                <th className="min-w-[120px] whitespace-nowrap px-4 py-3">{t.leads.colStatus}</th>
                <th className="min-w-[200px] whitespace-nowrap px-4 py-3">{t.leads.colNextAction}</th>
                <th className="min-w-[120px] px-4 py-3">
                  <span className="sr-only">{t.leads.colActions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => {
                const primary = group.signals[0];
                const techs = distinctTechnologies(group);
                const isSelected = group.signals.every((s) => selected.has(s.id));
                const isOpen = expanded.has(group.company.id);
                const action = nextActionForGroup(group);
                const isNearshore = group.signals.some((s) => s.mentions_nearshore);

                return (
                  <Fragment key={group.company.id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleGroup(group)}
                          aria-label={group.company.name}
                          className="h-4 w-4 rounded border-slate-300 text-dolphin-600 focus:ring-dolphin-500"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <CompanyLogo name={group.company.name} domain={group.company.domain} size={36} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Link
                                href={`/leads/${primary.id}`}
                                className="font-semibold text-ink hover:text-dolphin-700 hover:underline"
                              >
                                {group.company.name}
                              </Link>
                              {isNearshore && <NearshoreBadge lang={lang} />}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {group.signals.length > 1
                                ? `${t.leads.signalsCount(group.signals.length)} · ${techs.join(", ")}`
                                : primary.title}
                            </div>
                            {primary.location && (
                              <div className="mt-0.5 text-xs text-slate-400">{primary.location}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {techs.slice(0, 3).map((tech) => (
                            <TechBadge key={tech} technology={tech} />
                          ))}
                          {techs.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                              +{techs.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <ResponsibleCell name={primary.assigned_user?.full_name ?? primary.assigned_user?.email ?? null} unassignedLabel={t.leads.unassigned} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <StatusDot status={primary.status} lang={lang} />
                          {primary.vacancy_confirmed_at && (
                            <span title={t.leads.confirmedTitle} className="text-emerald-600">
                              <IconCheck className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <NextActionCell action={action} />
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        {group.signals.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(group.company.id)}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
                          >
                            {isOpen ? t.leads.collapseSignals : t.leads.expandSignals}
                            <IconChevronRight
                              className={"h-3.5 w-3.5 transition-transform " + (isOpen ? "rotate-90" : "")}
                            />
                          </button>
                        ) : (
                          <DeleteSignalButton signalId={primary.id} title={primary.title} />
                        )}
                      </td>
                    </tr>
                    {isOpen &&
                      group.signals.map((s) => (
                        <tr key={s.id} className="bg-slate-50/60 text-xs">
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2" colSpan={2}>
                            <Link href={`/leads/${s.id}`} className="font-medium text-dolphin-700 hover:underline">
                              {s.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <TechBadge technology={s.technology} />
                              <SourceBadge source={s.source} originLabel={s.origin_label} lang={lang} />
                              <WorkModeBadge workMode={s.work_mode} location={s.location} lang={lang} />
                              <PriorityBadge priority={s.priority} lang={lang} />
                            </div>
                          </td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2">
                            <StatusBadge status={s.status} lang={lang} />
                          </td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 text-right">
                            <DeleteSignalButton signalId={s.id} title={s.title} />
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {noSignalsLabel}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjetas — solo en móvil */}
      <div className="space-y-3 md:hidden">
        {groups.map((group) => {
          const primary = group.signals[0];
          const techs = distinctTechnologies(group);
          const isSelected = group.signals.every((s) => selected.has(s.id));
          const action = nextActionForGroup(group);
          const isNearshore = group.signals.some((s) => s.mentions_nearshore);

          return (
            <div key={group.company.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleGroup(group)}
                  aria-label={group.company.name}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-dolphin-600 focus:ring-dolphin-500"
                />
                <CompanyLogo name={group.company.name} domain={group.company.domain} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/leads/${primary.id}`} className="font-semibold text-ink hover:underline">
                      {group.company.name}
                    </Link>
                    {isNearshore && <NearshoreBadge lang={lang} />}
                  </div>
                  <div className="text-xs text-slate-500">
                    {group.signals.length > 1
                      ? `${t.leads.signalsCount(group.signals.length)} · ${techs.join(", ")}`
                      : primary.title}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {techs.map((tech) => (
                  <TechBadge key={tech} technology={tech} />
                ))}
                <StatusDot status={primary.status} lang={lang} />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <ResponsibleCell
                  name={primary.assigned_user?.full_name ?? primary.assigned_user?.email ?? null}
                  unassignedLabel={t.leads.unassigned}
                />
                <NextActionCell action={action} />
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-card">
            {noSignalsLabel}
          </p>
        )}
      </div>

      {selectedIds.length > 0 && (
        <BulkActionBar
          signalIds={selectedIds}
          companyCount={selectedCompanyCount}
          users={users}
          onClose={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}

function ResponsibleCell({ name, unassignedLabel }: { name: string | null; unassignedLabel: string }) {
  if (!name) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
        <IconUser className="h-4 w-4" />
        {unassignedLabel}
      </span>
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dolphin-100 text-[10px] font-semibold text-dolphin-700">
        {initials || "?"}
      </span>
      {name}
    </span>
  );
}

function NextActionCell({ action }: { action: NextActionInfo }) {
  const { t, lang } = useLanguage();

  if (action.kind === "none") {
    return <span className="whitespace-nowrap text-xs text-slate-400">{t.leads.actionNone}</span>;
  }

  if (action.kind === "follow_up") {
    const color = action.isOverdue ? "text-red-600" : action.isToday ? "text-amber-600" : "text-slate-600";
    const Icon = action.isOverdue ? IconAlertTriangle : IconCalendar;
    const dateLine = action.isOverdue
      ? `${t.leads.actionOverdue} · ${formatDate(action.date!, lang)}`
      : action.isToday
        ? t.leads.actionToday
        : formatDate(action.date!, lang);
    return (
      <div className={"flex max-w-[220px] items-start gap-1.5 text-xs font-medium " + color}>
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="min-w-0">
          <div
            className="line-clamp-2 leading-snug"
            title={action.note ?? undefined}
          >
            {action.note ?? t.leads.bulkScheduleFollowUp}
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[11px] font-normal opacity-80">{dateLine}</div>
        </div>
      </div>
    );
  }

  const label =
    action.kind === "assign" ? t.leads.actionAssign : action.kind === "find_contact" ? t.leads.actionFindContact : t.leads.actionReview;

  return (
    <div className="max-w-[220px] text-xs font-medium text-slate-500">
      <div className="leading-snug">{label}</div>
      <div className="mt-0.5 whitespace-nowrap text-[11px] font-normal text-slate-400">{t.leads.actionSuggested}</div>
    </div>
  );
}
