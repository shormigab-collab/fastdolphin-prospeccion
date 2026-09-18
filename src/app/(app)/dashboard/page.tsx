import Link from "next/link";
import { listSignals } from "@/lib/queries";
import { StatusBadge, TechBadge } from "@/components/Badges";

export default async function DashboardPage() {
  const all = await listSignals();

  const nuevos = all.filter((s) => s.status === "nuevo").length;
  const enProceso = all.filter((s) =>
    ["calificando", "contactado", "en_conversacion"].includes(s.status)
  ).length;
  const reuniones = all.filter((s) => s.status === "reunion_agendada" || s.status === "ganado").length;
  const alta = all.filter((s) => s.priority === "alta" && s.status !== "descartado").length;

  const byTech = all.reduce<Record<string, number>>((acc, s) => {
    acc[s.technology] = (acc[s.technology] ?? 0) + 1;
    return acc;
  }, {});

  const recent = all.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resumen de prospección</h1>
          <p className="mt-1 text-sm text-slate-500">
            Señales combinadas de Apollo.io y hallazgos manuales de LinkedIn.
          </p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-md bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dolphin-700"
        >
          + Cargar señal de LinkedIn
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Señales nuevas" value={nuevos} />
        <Stat label="En proceso" value={enProceso} />
        <Stat label="Reuniones / ganadas" value={reuniones} />
        <Stat label="Prioridad alta activas" value={alta} />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Señales recientes
          </h2>
          <div className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {recent.length === 0 && (
              <p className="p-6 text-sm text-slate-500">
                Aún no hay señales. Corre la semilla de datos de ejemplo o
                carga una manualmente.
              </p>
            )}
            {recent.map((s) => (
              <Link
                key={s.id}
                href={`/leads/${s.id}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {s.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {s.company?.name ?? "Empresa sin nombre"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <TechBadge technology={s.technology} />
                  <StatusBadge status={s.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Por tecnología
          </h2>
          <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-4">
            {Object.entries(byTech).length === 0 && (
              <p className="text-sm text-slate-500">Sin datos todavía.</p>
            )}
            {Object.entries(byTech)
              .sort((a, b) => b[1] - a[1])
              .map(([tech, count]) => (
                <div key={tech} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{tech}</span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
