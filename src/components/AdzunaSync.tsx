"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { ADZUNA_COUNTRIES, type AdzunaCountry } from "@/lib/adzuna";
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

export function AdzunaSync() {
  const router = useRouter();
  const { t } = useLanguage();
  const [technology, setTechnology] = useState<Technology>("SAP");
  const [country, setCountry] = useState<AdzunaCountry>("us");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/adzuna/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technology, country }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? t.adzunaSync.genericError);
      } else if (body.total === 0) {
        setResult(t.adzunaSync.noMore);
        router.refresh();
      } else {
        setResult(t.adzunaSync.done(body.created, body.skipped, body.total));
        router.refresh();
      }
    } catch {
      setError(t.adzunaSync.connectionError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
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
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value as AdzunaCountry)}
          className="rounded-xl border border-slate-300 px-2 py-1.5 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
        >
          {ADZUNA_COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleSync}
          disabled={loading}
          className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
        >
          {loading ? t.adzunaSync.syncing : t.adzunaSync.syncNow}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{t.adzunaSync.help}</p>
      {result && <p className="mt-2 text-sm text-emerald-700">{result}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
