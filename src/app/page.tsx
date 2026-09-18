import Link from "next/link";

const stack = [
  { name: "SAP", desc: "S/4HANA, ABAP, Basis, funcionales" },
  { name: "Oracle", desc: "DBA, ERP, middleware" },
  { name: "Salesforce", desc: "Admin, desarrollo, integraciones" },
  { name: "Cloud/DevOps", desc: "AWS, Azure, GCP, SRE" },
  { name: "Datos/IA", desc: "Data engineering, ML, analítica" },
  { name: "Desarrollo", desc: "Full-stack, móvil, QA" },
  { name: "Ciberseguridad", desc: "SOC, GRC, ingeniería de seguridad" },
  { name: "PM/Consultoría", desc: "Gerentes de proyecto, consultores técnicos" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-dolphin-950 to-dolphin-900 text-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-widest text-dolphin-300">
            FAST DOLPHIN · PROSPECCIÓN
          </span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-dolphin-500 px-4 py-2 text-sm font-semibold text-dolphin-950 hover:bg-dolphin-400"
            >
              Crear cuenta
            </Link>
          </div>
        </div>

        <div className="mt-20 max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Detecta antes que nadie qué empresas están buscando el talento
            que Fast Dolphin puede colocar.
          </h1>
          <p className="mt-6 text-lg text-dolphin-100">
            Un solo lugar para reunir señales de contratación (Apollo.io +
            hallazgos manuales de LinkedIn), priorizarlas, y preparar el
            primer mensaje de outreach — siempre revisado por una persona
            antes de enviarse.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-dolphin-500 px-6 py-3 font-semibold text-dolphin-950 hover:bg-dolphin-400"
            >
              Crear cuenta con tu correo @fastdolphin.com
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Feature
            title="Señales en un solo lugar"
            body="Datos de Apollo.io combinados con hallazgos que el equipo pega manualmente desde LinkedIn: publicaciones de vacantes, contrataciones recientes, señales de expansión."
          />
          <Feature
            title="Priorizado para vender"
            body="Cada señal se clasifica por tecnología y se compara contra lo que Fast Dolphin ya ofrece, para saber a quién contactar primero."
          />
          <Feature
            title="Mensajes sugeridos, no automáticos"
            body="La herramienta redacta un borrador de acercamiento por señal. Nada sale sin que alguien del equipo lo revise y apruebe."
          />
        </div>

        <div className="mt-20">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-dolphin-300">
            Tecnologías que cubrimos
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stack.map((s) => (
              <div
                key={s.name}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="font-semibold">{s.name}</div>
                <div className="mt-1 text-sm text-dolphin-200">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-dolphin-100">{body}</p>
    </div>
  );
}
