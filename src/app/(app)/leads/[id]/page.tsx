import Link from "next/link";
import { notFound } from "next/navigation";
import { getSignalById, messagesForSignal, notesForSignal } from "@/lib/queries";
import { TechBadge, PriorityBadge, SourceBadge, WorkModeBadge, NearshoreBadge } from "@/components/Badges";
import { suggestionsForSignal } from "@/lib/suggestions";
import { isApolloConnected } from "@/lib/apollo";
import { ContactLookup } from "@/components/ContactLookup";
import { IconLink } from "@/components/icons";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/getLang";
import { StatusForm } from "./StatusForm";
import { MessagePanel } from "./MessagePanel";
import { NotesForm } from "./NotesForm";
import { ConfirmVacancyButton } from "./ConfirmVacancyButton";
import { JobBoardCheck } from "./JobBoardCheck";

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lang = getLang();
  const t = getDict(lang);

  const signal = await getSignalById(params.id);
  if (!signal) notFound();

  const [messages, notes] = await Promise.all([
    messagesForSignal(params.id),
    notesForSignal(params.id),
  ]);

  const pitch = suggestionsForSignal(signal);
  const detectedAt = new Date(signal.detected_at).toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-xs font-medium text-slate-400">
        {t.leadDetail.breadcrumbPrefix}
        {signal.company?.name ?? t.leadDetail.detailFallback}
      </p>
      <Link href="/leads" className="mt-1 inline-block text-sm text-dolphin-600 hover:underline">
        {t.leadDetail.back}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{signal.company?.name ?? signal.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {signal.company?.industry ?? t.leadDetail.unspecifiedIndustry}
            {signal.location ? ` · ${signal.location}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <PriorityBadge priority={signal.priority} lang={lang} />
            <TechBadge technology={signal.technology} />
            {signal.mentions_nearshore && <NearshoreBadge lang={lang} />}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusForm signalId={signal.id} status={signal.status} />
          <ConfirmVacancyButton signalId={signal.id} confirmedAt={signal.vacancy_confirmed_at} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t.leadDetail.hiringSignal}
            </h2>
            <p className="mt-2 text-base font-semibold text-ink">{signal.title}</p>

            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-400">{t.leadDetail.technology}</dt>
                <dd className="mt-1"><TechBadge technology={signal.technology} /></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">{t.leadDetail.workMode}</dt>
                <dd className="mt-1">
                  <WorkModeBadge workMode={signal.work_mode} location={signal.location} lang={lang} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">{t.leadDetail.source}</dt>
                <dd className="mt-1 flex items-center gap-1.5">
                  <SourceBadge source={signal.source} originLabel={signal.origin_label} lang={lang} />
                  {signal.source_url && (
                    <a
                      href={signal.source_url}
                      target="_blank"
                      rel="noreferrer"
                      title={t.leadDetail.viewOriginalLinkedin}
                      className="text-slate-400 hover:text-dolphin-600"
                    >
                      <IconLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">{t.leadDetail.detectedDate}</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{detectedAt}</dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t.leadDetail.description}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600">
                {signal.raw_text || t.leadDetail.noDescription}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dolphin-100 bg-dolphin-50 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-dolphin-700">
              {t.leadDetail.whyRelevant}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-800">{pitch.servicio}</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              {pitch.argumentos.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>

          <ContactLookup
            signalId={signal.id}
            apolloConnected={isApolloConnected()}
            initialContact={{
              name: signal.contact_name,
              title: signal.contact_title,
              email: signal.contact_email,
              emailStatus: signal.contact_email_status,
              phone: signal.contact_phone,
              linkedinUrl: signal.contact_linkedin_url,
              apolloId: signal.contact_apollo_id,
              lookedUpAt: signal.contact_looked_up_at,
            }}
          />

          <JobBoardCheck
            signalId={signal.id}
            companyId={signal.company_id}
            technology={signal.technology}
            careersUrl={signal.company?.careers_url ?? null}
            alreadyConfirmed={!!signal.vacancy_confirmed_at}
          />

          <NotesForm signalId={signal.id} notes={notes} />
        </div>

        <div className="lg:col-span-2">
          <MessagePanel signalId={signal.id} messages={messages} />
        </div>
      </div>
    </div>
  );
}
