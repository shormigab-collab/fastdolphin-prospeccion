import Link from "next/link";
import { notFound } from "next/navigation";
import { getSignalById, messagesForSignal, notesForSignal } from "@/lib/queries";
import { TechBadge, PriorityBadge, SourceBadge, WorkModeBadge } from "@/components/Badges";
import { suggestionsForSignal } from "@/lib/suggestions";
import { isApolloConnected } from "@/lib/apollo";
import { ContactLookup } from "@/components/ContactLookup";
import { StatusForm } from "./StatusForm";
import { MessagePanel } from "./MessagePanel";
import { NotesForm } from "./NotesForm";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const signal = await getSignalById(params.id);
  if (!signal) notFound();

  const [messages, notes] = await Promise.all([
    messagesForSignal(params.id),
    notesForSignal(params.id),
  ]);

  const pitch = suggestionsForSignal(signal);

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <Link href="/leads" className="text-sm text-dolphin-600 hover:underline">
        ← Volver a señales
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{signal.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {signal.company?.name}
            {signal.company?.industry ? ` · ${signal.company.industry}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TechBadge technology={signal.technology} />
            <PriorityBadge priority={signal.priority} />
            <SourceBadge source={signal.source} />
            <WorkModeBadge workMode={signal.work_mode} location={signal.location} />
          </div>
        </div>
        <StatusForm signalId={signal.id} status={signal.status} />
      </div>

      {signal.source_url && (
        <a
          href={signal.source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-dolphin-600 hover:underline"
        >
          Ver publicación original en LinkedIn ↗
        </a>
      )}

      {signal.raw_text && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">Contexto detectado: </span>
          {signal.raw_text}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-dolphin-100 bg-dolphin-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-dolphin-700">
          Cómo encaja con lo que ofrece Fast Dolphin
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-800">{pitch.servicio}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
          {pitch.argumentos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-6">
        <ContactLookup
          signalId={signal.id}
          apolloConnected={isApolloConnected()}
          initialContact={{
            name: signal.contact_name,
            title: signal.contact_title,
            email: signal.contact_email,
            phone: signal.contact_phone,
            linkedinUrl: signal.contact_linkedin_url,
            lookedUpAt: signal.contact_looked_up_at,
          }}
        />
        <MessagePanel signalId={signal.id} messages={messages} />
        <NotesForm signalId={signal.id} notes={notes} />
      </div>
    </div>
  );
}
