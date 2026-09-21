import Link from "next/link";
import { createManualSignalAction } from "./actions";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/getLang";

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

export default function NewLeadPage() {
  const lang = getLang();
  const t = getDict(lang);

  const SIGNAL_TYPES = [
    { value: "vacante_publicada", label: t.leadNew.signalTypePublished },
    { value: "contratacion_reciente", label: t.leadNew.signalTypeHire },
    { value: "expansion", label: t.leadNew.signalTypeExpansion },
    { value: "tecnologia_detectada", label: t.leadNew.signalTypeTech },
    { value: "otro", label: t.leadNew.signalTypeOther },
  ];

  const ORIGINS = ["LinkedIn", "Indeed", "Computrabajo", t.leadNew.originCompanyPage, t.leadNew.originOther];

  const PRIORITIES: { value: "alta" | "media" | "baja"; label: string }[] = [
    { value: "alta", label: t.priority.alta },
    { value: "media", label: t.priority.media },
    { value: "baja", label: t.priority.baja },
  ];

  const WORK_MODES = [
    { value: "remoto", label: t.leadNew.remote },
    { value: "hibrido", label: t.leadNew.hybrid },
    { value: "presencial", label: t.leadNew.onsite },
  ];

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <p className="text-xs font-medium text-slate-400">{t.leadNew.breadcrumb}</p>
      <Link href="/leads" className="mt-1 inline-block text-sm text-dolphin-600 hover:underline">
        {t.leadNew.back}
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-ink">{t.leadNew.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.leadNew.subtitle}</p>

      <form
        action={createManualSignalAction}
        className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label={t.leadNew.companyName} name="companyName" required placeholder="Acme Corp" />
          <Field label={t.leadNew.companyDomain} name="companyDomain" placeholder="acme.com" />
        </div>

        <Field
          label={t.leadNew.signalTitle}
          name="title"
          required
          placeholder={t.leadNew.signalTitlePlaceholder}
        />

        <div>
          <label className="text-sm font-medium text-ink">{t.leadNew.whereFound}</label>
          <select
            name="originLabel"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          >
            {ORIGINS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink">{t.leadNew.technology}</label>
            <select
              name="technology"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            >
              {TECHNOLOGIES.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink">{t.leadNew.signalType}</label>
            <select
              name="signalType"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            >
              {SIGNAL_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">{t.leadNew.priority}</label>
          <div className="mt-1 flex gap-3">
            {PRIORITIES.map((p, i) => (
              <label key={p.value} className="flex items-center gap-2 text-sm capitalize text-slate-600">
                <input type="radio" name="priority" value={p.value} defaultChecked={i === 1} />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-ink">{t.leadNew.workMode}</label>
            <div className="mt-1 flex gap-3">
              {WORK_MODES.map((m, i) => (
                <label key={m.value} className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="radio" name="workMode" value={m.value} defaultChecked={i === 0} />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
          <Field
            label={t.leadNew.location}
            name="location"
            placeholder={t.leadNew.locationPlaceholder}
          />
        </div>
        <p className="-mt-2 text-xs text-slate-500">{t.leadNew.workPolicyNote}</p>

        <Field
          label={t.leadNew.sourceUrl}
          name="sourceUrl"
          type="url"
          placeholder="https://..."
        />

        <div>
          <label className="text-sm font-medium text-ink">{t.leadNew.rawText}</label>
          <textarea
            name="rawText"
            rows={5}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
            placeholder={t.leadNew.rawTextPlaceholder}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-dolphin-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-dolphin-700"
        >
          {t.leadNew.save}
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
      <label className="text-sm font-medium text-ink">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
      />
    </div>
  );
}
