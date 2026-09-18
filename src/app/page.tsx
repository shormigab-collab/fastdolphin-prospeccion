import Link from "next/link";
import { Logo } from "@/components/Logo";
import { IconLock, IconSearch, IconTarget, IconUpload as IconSend } from "@/components/icons";

const TECHNOLOGIES = [
  "SAP",
  "Oracle",
  "Salesforce",
  "Cloud / DevOps",
  "Datos e IA",
  "Desarrollo",
  "Ciberseguridad",
  "PM / Consultoría",
];

const STEPS = [
  {
    n: "01",
    title: "Detecta señales",
    body: "Encuentra empresas que muestran necesidades reales de talento.",
    icon: IconSearch,
  },
  {
    n: "02",
    title: "Prioriza oportunidades",
    body: "Analiza y enfócate en las cuentas con mayor potencial.",
    icon: IconTarget,
  },
  {
    n: "03",
    title: "Prepara el contacto",
    body: "Obtén contexto clave y redacta tu primer mensaje con confianza.",
    icon: IconSend,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-auto" />
            <span className="hidden text-sm font-medium text-slate-400 sm:inline">
              Prospección
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-dolphin-700"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold tracking-widest text-dolphin-600">
              INTELIGENCIA COMERCIAL
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-5xl">
              La próxima oportunidad empieza con una señal.
            </h1>
            <p className="mt-5 max-w-md text-base text-slate-500">
              Identifica empresas con necesidades de talento, prioriza
              oportunidades y prepara tu próximo contacto.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-dolphin-600 px-6 py-3 text-sm font-semibold text-white shadow-card hover:bg-dolphin-700"
              >
                Entrar a la plataforma →
              </Link>
              <Link
                href="/signup"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-slate-50"
              >
                Crear cuenta
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <IconLock className="h-3.5 w-3.5" />
              Acceso exclusivo para el equipo Fast Dolphin.
            </p>
          </div>

          <DashboardPreview />
        </div>

        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dolphin-50 text-dolphin-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-dolphin-600">{step.n}</span>
                    <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{step.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 flex flex-col items-start justify-between gap-6 border-t border-slate-200 pt-8 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-400">
              TECNOLOGÍAS CLAVE
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TECHNOLOGIES.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-ink"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right text-xs font-medium text-slate-400">
            Great talent,
            <br />
            better results.
          </div>
        </div>
      </div>
    </main>
  );
}

// Vista previa ilustrativa del dashboard, solo para la página de inicio
// (no hay sesión todavía, así que no hay datos reales que mostrar aquí).
function DashboardPreview() {
  const rows = [
    { name: "Industrias García S.A.", tag: "Manufactura", tech: "SAP", priority: "Alta" },
    { name: "Comercial Andina", tag: "Retail", tech: "Oracle", priority: "Alta" },
    { name: "Grupo Soluciones Digitales", tag: "Tecnología", tech: "Datos/IA", priority: "Alta" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card sm:p-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Logo className="h-5 w-auto" />
        </div>
        <div className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-400 sm:flex">
          <IconSearch className="h-3.5 w-3.5" />
          Buscar empresas, sectores o tecnologías...
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Oportunidades prioritarias</h3>
        <span className="text-xs font-medium text-dolphin-600">Ver todas →</span>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-ink">{r.name}</span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  {r.tag}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">Fuente: Apollo.io</div>
            </div>
            <span className="shrink-0 rounded-full bg-dolphin-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              {r.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
