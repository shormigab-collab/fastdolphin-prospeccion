"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { TechBadge, SourceBadge } from "@/components/Badges";
import { CompanyLogo } from "@/components/CompanyLogo";
import { IconPulse, IconNote, IconMail, IconCheck, IconChevronRight } from "@/components/icons";
import { timeAgo } from "@/lib/time";
import { useLanguage } from "@/components/LanguageProvider";
import type { RecentActivityItem } from "@/lib/queries";

type Tab = "all" | "created" | "contact" | "note-status";
type Range = "today" | "7d" | "30d" | "all";

async function fetchActivity(tab: Tab, range: Range): Promise<RecentActivityItem[]> {
  const kindParam = tab === "created" || tab === "contact" ? tab : undefined;
  const params = new URLSearchParams({ range });
  if (kindParam) params.set("kind", kindParam);

  const res = await fetch(`/api/activity?${params.toString()}`);
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as { items?: RecentActivityItem[] };
  const items = body.items ?? [];

  if (tab === "note-status") {
    return items.filter((i) => i.kind === "note" || i.kind === "status");
  }
  return items;
}

export function ActivityTimeline({ initialItems }: { initialItems: RecentActivityItem[] }) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<Tab>("all");
  const [range, setRange] = useState<Range>("today");
  const [items, setItems] = useState(initialItems);
  const [grouped, setGrouped] = useState(true);
  const [isPending, startTransition] = useTransition();

  const TABS: { value: Tab; label: string }[] = [
    { value: "all", label: t.activity.tabAll },
    { value: "created", label: t.activity.tabCreated },
    { value: "contact", label: t.activity.tabContact },
    { value: "note-status", label: t.activity.tabNoteStatus },
  ];

  const RANGES: { value: Range; label: string }[] = [
    { value: "today", label: t.activity.rangeToday },
    { value: "7d", label: t.activity.range7d },
    { value: "30d", label: t.activity.range30d },
    { value: "all", label: t.activity.rangeAll },
  ];

  const KIND_META: Record<
    RecentActivityItem["kind"],
    { label: string; icon: typeof IconPulse; className: string }
  > = {
    created: { label: t.activity.kindCreated, icon: IconPulse, className: "bg-dolphin-50 text-dolphin-600" },
    contact: { label: t.activity.kindContact, icon: IconMail, className: "bg-sky-50 text-sky-600" },
    note: { label: t.activity.kindNote, icon: IconNote, className: "bg-amber-50 text-amber-600" },
    status: { label: t.activity.kindStatus, icon: IconCheck, className: "bg-emerald-50 text-emerald-600" },
  };

  function describeActivity(a: RecentActivityItem) {
    if (a.kind === "note") {
      const preview = (a.note_body ?? "").slice(0, 90);
      return `"${preview}${(a.note_body?.length ?? 0) > 90 ? "…" : ""}"`;
    }
    if (a.kind === "created") return a.signal_title;
    if (a.kind === "contact") {
      return a.contact_name ? t.activity.contactFound(a.contact_name) : t.activity.contactFoundGeneric;
    }
    return t.activity.statusChanged(t.status[a.status]);
  }

  function updateFilters(nextTab: Tab, nextRange: Range) {
    setTab(nextTab);
    setRange(nextRange);
    startTransition(async () => {
      const results = await fetchActivity(nextTab, nextRange);
      setItems(results);
    });
  }

  const groups = useMemo(() => {
    const byCompany = new Map<string, { name: string; domain: string | null; items: RecentActivityItem[] }>();
    const order: string[] = [];
    for (const a of items) {
      const existing = byCompany.get(a.company_name);
      if (existing) {
        existing.items.push(a);
      } else {
        byCompany.set(a.company_name, { name: a.company_name, domain: a.company_domain, items: [a] });
        order.push(a.company_name);
      }
    }
    return order.map((name) => byCompany.get(name)!);
  }, [items]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tb) => (
            <button
              key={tb.value}
              onClick={() => updateFilters(tb.value, range)}
              disabled={isPending}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-60 " +
                (tab === tb.value
                  ? "border-dolphin-600 bg-dolphin-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
              }
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={range}
            disabled={isPending}
            onChange={(e) => updateFilters(tab, e.target.value as Range)}
            className="appearance-none rounded-xl border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-ink shadow-card focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500 disabled:opacity-60"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-sm text-slate-500">{t.activity.empty}</p>
        </div>
      ) : grouped ? (
        <div className="mt-4 space-y-4">
          {groups.map((g) => (
            <div key={g.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CompanyLogo name={g.name} domain={g.domain} size={32} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{g.name}</p>
                    <p className="text-xs text-slate-400">{t.activity.activitiesCount(g.items.length)}</p>
                  </div>
                </div>
                <Link
                  href={`/leads/${g.items[0].signal_id}`}
                  className="shrink-0 text-xs font-medium text-dolphin-600 hover:underline"
                >
                  {t.activity.viewOpportunity}
                </Link>
              </div>
              <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3">
                {g.items.map((a, i) => {
                  const meta = KIND_META[a.kind];
                  const Icon = meta.icon;
                  return (
                    <Link
                      key={`${a.kind}-${a.signal_id}-${i}`}
                      href={`/leads/${a.signal_id}`}
                      className="flex items-start gap-2.5 rounded-xl px-1.5 py-1 hover:bg-slate-50"
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${meta.className}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{meta.label}</p>
                        <p className="truncate text-xs text-slate-500">{describeActivity(a)}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.at, lang)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((a, i) => {
            const meta = KIND_META[a.kind];
            const Icon = meta.icon;
            return (
              <Link
                key={`${a.kind}-${a.signal_id}-${i}`}
                href={`/leads/${a.signal_id}`}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-dolphin-200"
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.className}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{meta.label}</span>
                  <span className="ml-auto shrink-0 text-xs text-slate-400">{timeAgo(a.at, lang)}</span>
                </div>
                <div className="mt-3 flex items-start gap-2.5">
                  <CompanyLogo name={a.company_name} domain={a.company_domain} size={32} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{a.company_name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{describeActivity(a)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <TechBadge technology={a.technology} />
                  <SourceBadge source={a.source} lang={lang} />
                  <span className="ml-auto shrink-0 text-xs font-medium text-dolphin-600">
                    {t.activity.viewSignal}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{t.activity.groupToggle}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t.activity.groupToggleHelp}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={grouped}
            onClick={() => setGrouped((g) => !g)}
            className={
              "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
              (grouped ? "bg-dolphin-600" : "bg-slate-200")
            }
          >
            <span
              className={
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " +
                (grouped ? "translate-x-5" : "translate-x-0.5")
              }
            />
          </button>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
          <IconChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t.activity.groupToggleNote}
        </p>
      </div>
    </div>
  );
}
