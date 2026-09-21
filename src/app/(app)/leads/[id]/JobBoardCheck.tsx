"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCareersUrlAction, confirmVacancyFromJobBoardAction } from "./actions";
import { IconLink, IconCheck } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";

interface JobBoardPosting {
  title: string;
  url: string;
  location?: string | null;
}

interface CheckResult {
  provider: "greenhouse" | "lever" | null;
  positions: JobBoardPosting[];
  matches: JobBoardPosting[];
  error?: string;
}

export function JobBoardCheck({
  signalId,
  companyId,
  technology,
  careersUrl,
  alreadyConfirmed,
}: {
  signalId: string;
  companyId: string;
  technology: string;
  careersUrl: string | null;
  alreadyConfirmed: boolean;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [editingUrl, setEditingUrl] = useState(!careersUrl);
  const [urlInput, setUrlInput] = useState(careersUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  function saveUrl() {
    if (!urlInput.trim()) return;
    startTransition(() => {
      saveCareersUrlAction(companyId, signalId, urlInput.trim());
    });
    setEditingUrl(false);
  }

  async function runCheck() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/jobboard/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId }),
      });
      const body = (await res.json().catch(() => ({}))) as CheckResult;
      setResult(body);
    } catch {
      setResult({ provider: null, positions: [], matches: [], error: t.jobBoard.noConnection });
    } finally {
      setLoading(false);
    }
  }

  async function confirmWith(position: JobBoardPosting) {
    setConfirming(position.url);
    await confirmVacancyFromJobBoardAction(signalId, { title: position.title, url: position.url });
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t.jobBoard.title}
        </h2>
        {careersUrl && !editingUrl && (
          <button
            onClick={() => setEditingUrl(true)}
            className="shrink-0 text-xs font-medium text-slate-400 hover:text-dolphin-600"
          >
            {t.jobBoard.changeLink}
          </button>
        )}
      </div>

      {editingUrl ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-500">
            {t.jobBoard.helpText1}{" "}
            <code className="text-slate-400">jobs.lever.co/empresa</code> {t.jobBoard.helpTextOr}{" "}
            <code className="text-slate-400">boards.greenhouse.io/empresa</code>
            {t.jobBoard.helpTextEnd}
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={t.jobBoard.urlPlaceholder}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            />
            <button
              onClick={saveUrl}
              disabled={isPending || !urlInput.trim()}
              className="shrink-0 rounded-xl bg-dolphin-600 px-3 py-2 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {t.jobBoard.save}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={careersUrl!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-dolphin-600 hover:underline"
          >
            <IconLink className="h-3.5 w-3.5" />
            {careersUrl}
          </a>
          <button
            onClick={runCheck}
            disabled={loading}
            className="ml-auto shrink-0 rounded-xl bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
          >
            {loading ? t.jobBoard.checking : t.jobBoard.searchOpenPositions}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {result.error && <p className="text-sm text-amber-700">{result.error}</p>}

          {!result.error && result.matches.length === 0 && (
            <p className="text-sm text-slate-500">
              {t.jobBoard.noMatches(technology, result.positions.length)}
            </p>
          )}

          {result.matches.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-700">
                {t.jobBoard.matchesFound(result.matches.length)}
              </p>
              {result.matches.map((p) => (
                <div
                  key={p.url}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-emerald-800 hover:underline"
                    >
                      {p.title}
                    </a>
                    {p.location && <p className="text-xs text-emerald-700">{p.location}</p>}
                  </div>
                  {alreadyConfirmed ? (
                    <span className="shrink-0 text-xs font-medium text-emerald-700">
                      {t.jobBoard.alreadyConfirmed}
                    </span>
                  ) : (
                    <button
                      onClick={() => confirmWith(p)}
                      disabled={confirming === p.url}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <IconCheck className="h-3 w-3" />
                      {confirming === p.url ? t.jobBoard.confirming : t.jobBoard.confirmWith}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
