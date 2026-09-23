"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { IconX } from "@/components/icons";
import { bulkAssignAction, bulkStatusAction, bulkFollowUpAction } from "./actions";
import type { SignalStatus } from "@/lib/types";

const ALL_STATUSES: SignalStatus[] = [
  "nuevo",
  "calificando",
  "contactado",
  "en_conversacion",
  "reunion_agendada",
  "ganado",
  "descartado",
];

type Panel = null | "assign" | "status" | "followUp";

export function BulkActionBar({
  signalIds,
  companyCount,
  users,
  onClose,
}: {
  signalIds: string[];
  companyCount: number;
  users: { id: string; email: string; full_name: string | null }[];
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [panel, setPanel] = useState<Panel>(null);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<SignalStatus>("contactado");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);

  function apply() {
    startTransition(async () => {
      if (panel === "assign") {
        await bulkAssignAction(signalIds, userId === "__unassigned__" ? null : userId || null);
      } else if (panel === "status") {
        await bulkStatusAction(signalIds, status);
      } else if (panel === "followUp") {
        await bulkFollowUpAction(signalIds, date || null, note || null);
      }
      setDone(t.leads.bulkAppliedToCompanies(companyCount));
      setPanel(null);
      router.refresh();
    });
  }

  return (
    <div className="sticky bottom-4 z-20 mt-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white">
            {t.leads.selectedCount(signalIds.length)}
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setPanel(panel === "assign" ? null : "assign")}
            className={
              "rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 " +
              (panel === "assign"
                ? "border-dolphin-600 bg-dolphin-50 text-dolphin-700"
                : "border-slate-200 text-ink hover:bg-slate-50")
            }
          >
            {t.leads.bulkAssign}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setPanel(panel === "status" ? null : "status")}
            className={
              "rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 " +
              (panel === "status"
                ? "border-dolphin-600 bg-dolphin-50 text-dolphin-700"
                : "border-slate-200 text-ink hover:bg-slate-50")
            }
          >
            {t.leads.bulkChangeStatus}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setPanel(panel === "followUp" ? null : "followUp")}
            className={
              "rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 " +
              (panel === "followUp"
                ? "border-dolphin-600 bg-dolphin-50 text-dolphin-700"
                : "border-slate-200 text-ink hover:bg-slate-50")
            }
          >
            {t.leads.bulkScheduleFollowUp}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-ink"
            aria-label={t.leads.bulkClose}
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {panel === "assign" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            >
              <option value="">{t.leads.bulkChooseUser}</option>
              <option value="__unassigned__">{t.leads.unassigned}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name ?? u.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPending || !userId}
              onClick={apply}
              className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {t.leads.bulkApply}
            </button>
          </div>
        )}

        {panel === "status" && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SignalStatus)}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.status[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPending}
              onClick={apply}
              className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {t.leads.bulkApply}
            </button>
          </div>
        )}

        {panel === "followUp" && (
          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">{t.leads.bulkFollowUpDate}</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </label>
            <label className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">{t.leads.bulkFollowUpNote}</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.leads.bulkFollowUpNotePlaceholder}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </label>
            <button
              type="button"
              disabled={isPending || !date}
              onClick={apply}
              className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {t.leads.bulkApply}
            </button>
          </div>
        )}

        {done && <p className="mt-2 text-xs text-emerald-700">{done}</p>}
      </div>
    </div>
  );
}
