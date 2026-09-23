import Link from "next/link";
import { listRecentActivity, listPendingFollowUps } from "@/lib/queries";
import { CompanyLogo } from "@/components/CompanyLogo";
import { IconAlertTriangle, IconCalendar } from "@/components/icons";
import { formatDate } from "@/lib/time";
import { ActivityTimeline } from "./ActivityTimeline";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/getLang";

export default async function ActivityPage() {
  const lang = getLang();
  const t = getDict(lang);

  const [activity, pending] = await Promise.all([
    listRecentActivity({ range: "today", limit: 30 }),
    listPendingFollowUps(),
  ]);

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-xs font-medium text-slate-400">{t.activity.breadcrumb}</p>
      <div className="mt-1">
        <h1 className="text-2xl font-bold text-ink">{t.activity.pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.activity.pageSubtitle}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityTimeline initialItems={activity} />
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t.activity.pendingTitle}
            {pending.length > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">
                {pending.length}
              </span>
            )}
          </h2>

          <div className="mt-3 space-y-2">
            {pending.length === 0 && (
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-card">
                {t.activity.pendingEmpty}
              </p>
            )}
            {pending.map((s) => {
              const isOverdue = (s.next_follow_up_at ?? "") < todayISO;
              const Icon = isOverdue ? IconAlertTriangle : IconCalendar;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-card"
                >
                  <CompanyLogo name={s.company?.name ?? "?"} domain={s.company?.domain} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{s.company?.name}</p>
                    <p className={"mt-0.5 flex items-center gap-1 text-xs " + (isOverdue ? "text-red-600" : "text-amber-600")}>
                      <Icon className="h-3 w-3 shrink-0" />
                      {s.next_follow_up_note ?? (isOverdue ? t.leads.actionOverdue : t.leads.actionToday)}
                      {" · "}
                      {formatDate(s.next_follow_up_at!, lang)}
                    </p>
                  </div>
                  <Link
                    href={`/leads/${s.id}`}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
                  >
                    {t.activity.pendingOpen}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
