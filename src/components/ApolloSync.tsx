"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function ApolloSync() {
  const router = useRouter();
  const [technology, setTechnology] = useState<Technology>("SAP");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/apollo/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technology }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? "No se pudo sincronizar con Apollo.io.");
      } else if (body.total === 0) {
        setResult(
          "Apollo no devolvió más empresas nuevas para esta tecnología por ahora — ya se recorrió lo que su plan expone. Vuelve a intentar más adelante."
        );
        router.refresh();
      } else {
        setResult(
          `Listo: ${body.created} señal(es) nueva(s), ${body.skipped} ya existían (de ${body.total} empresas encontradas).`
        );
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar con Apollo.io. Intenta de nuevo.");
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
          {TECHNOLOGIES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          onClick={handleSync}
          disabled={loading}
          className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
        >
          {loading ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Busca empresas en Apollo.io cuyo perfil coincide con esta tecnología y crea señales
        nuevas (sin duplicar las que ya existen). Cada vez que sincronizas avanza más
        adentro de los resultados de Apollo, para traer empresas distintas a las anteriores.
      </p>
      {result && <p className="mt-2 text-sm text-emerald-700">{result}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
