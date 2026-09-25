"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import type { Technology } from "@/lib/types";

const TECHNOLOGIES: Technology[] = [
  "SAP",
  "Oracle",
  "Salesforce",
  "Cloud/DevOps",
  "Datos/IA",
  "Desarrollo",
  "QA",
  "Ciberseguridad",
  "PM/Consultoría",
];

type Mode = "technology" | "nearshore";

export function RemoteOkSync() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("technology");
  const [technology, setTechnology] = useState<Technology>("SAP");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/remoteok/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "nearshore" ? { mode } : { mode, technology }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? t.remoteOkSync.genericError);
      } else if (body.total === 0) {
        setResult(mode === "nearshore" ? t.remoteOkSync.noMoreNearshore : t.remoteOkSync.noMore);
        router.refresh();
      } else {
        setResult(t.remoteOkSync.done(body.created, body.skipped, body.total));
        router.refresh();
      }
    } catch {
      setError(t.remoteOkSync.connectionError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/60 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setMode("technology")}
          className={`rounded-md px-2.5 py-1 transition ${
            mode === "technology" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.remoteOkSync.modeTechnology}
        </button>
        <button
          type="button"
          onClick={() => setMode("nearshore")}
          className={`rounded-md px-2.5 py-1 transition ${
            mode === "nearshore" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.remoteOkSync.modeNearshore}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {mode === "technology" && (
          <select
            value={technology}
            onChange={(e) => setTechnology(e.target.value as Technology)}
            className="rounded-xl border border-slate-300 px-2 py-1.5 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          >
            {TECHNOLOGIES.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleSync}
          disabled={loading}
          className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
        >
          {mode === "nearshore"
            ? loading
              ? t.remoteOkSync.searchingNearshore
              : t.remoteOkSync.searchNearshoreNow
            : loading
              ? t.remoteOkSync.syncing
              : t.remoteOkSync.syncNow}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {mode === "nearshore" ? t.remoteOkSync.nearshoreHelp : t.remoteOkSync.help}
      </p>
      {result && <p className="mt-2 text-sm text-emerald-700">{result}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
