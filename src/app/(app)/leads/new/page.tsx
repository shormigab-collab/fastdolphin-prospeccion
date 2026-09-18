import Link from "next/link";
import { createManualSignalAction } from "./actions";

const TECHNOLOGIES = [
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

const SIGNAL_TYPES = [
  { value: "vacante_publicada", label: "Vacante publicada" },
  { value: "contratacion_reciente", label: "Contratación reciente / cambio de liderazgo" },
  { value: "expansion", label: "Anuncio de expansión o crecimiento" },
  { value: "tecnologia_detectada", label: "Mención de tecnología / stack" },
  { value: "otro", label: "Otro" },
];

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <Link href="/leads" className="text-sm text-dolphin-600 hover:underline">
        ← Volver a señales
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">
        Cargar señal encontrada en LinkedIn
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Pega lo que encontraste manualmente en LinkedIn (una publicación de
        vacante, un post de la empresa, un cambio de liderazgo, etc.) y la
        herramienta la suma al mismo lugar que las señales de Apollo.io.
      </p>

      <form action={createManualSignalAction} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre de la empresa" name="companyName" required placeholder="Acme Corp" />
          <Field label="Dominio (opcional)" name="companyDomain" placeholder="acme.com" />
        </div>

        <Field
          label="Título de la señal"
          name="title"
          required
          placeholder='Ej: "Buscan SAP Consultant Senior en LinkedIn Jobs"'
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Tecnología</label>
            <select
              name="technology"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            >
              {TECHNOLOGIES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Tipo de señal</label>
            <select
              name="signalType"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            >
              {SIGNAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Prioridad</label>
          <div className="mt-1 flex gap-3">
            {["alta", "media", "baja"].map((p, i) => (
              <label key={p} className="flex items-center gap-2 text-sm capitalize text-slate-600">
                <input type="radio" name="priority" value={p} defaultChecked={i === 1} />
                {p}
              </label>
            ))}
          </div>
        </div>

        <Field
          label="Link de la publicación de LinkedIn (opcional)"
          name="sourceUrl"
          type="url"
          placeholder="https://www.linkedin.com/..."
        />

        <div>
          <label className="text-sm font-medium text-slate-700">
            Pega el texto de la publicación / contexto (opcional)
          </label>
          <textarea
            name="rawText"
            rows={5}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            placeholder="Pega aquí el texto de la publicación o una descripción de lo que viste..."
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-dolphin-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dolphin-700"
        >
          Guardar señal
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
      />
    </div>
  );
}
