import { listUsers } from "@/lib/queries";
import { isApolloConnected } from "@/lib/apollo";
import { isAdzunaConnected } from "@/lib/adzuna";
import { ApolloSync } from "@/components/ApolloSync";
import { AdzunaSync } from "@/components/AdzunaSync";
import { RemoteOkSync } from "@/components/RemoteOkSync";
import { RemotiveSync } from "@/components/RemotiveSync";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/getLang";

export default async function SettingsPage() {
  const lang = getLang();
  const t = getDict(lang);
  const users = await listUsers();
  const apolloConnected = isApolloConnected();
  const adzunaConnected = isAdzunaConnected();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <p className="text-xs font-medium text-slate-400">{t.settings.breadcrumb}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{t.settings.title}</h1>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t.settings.signalSources}
        </h2>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Apollo.io</div>
            <div className="text-xs text-slate-500">
              {apolloConnected ? t.settings.apolloConnected : t.settings.apolloNotConnected}
            </div>
          </div>
          <span
            className={
              "rounded-full px-2.5 py-0.5 text-xs font-medium " +
              (apolloConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
            }
          >
            {apolloConnected ? t.settings.connected : t.settings.pending}
          </span>
        </div>
        {apolloConnected ? (
          <ApolloSync />
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            {t.settings.connectHelpPrefix}{" "}
            <code className="rounded bg-slate-100 px-1">APOLLO_API_KEY</code>{" "}
            {t.settings.connectHelpSuffix}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Adzuna</div>
            <div className="text-xs text-slate-500">
              {adzunaConnected ? t.settings.adzunaConnected : t.settings.adzunaNotConnected}
            </div>
          </div>
          <span
            className={
              "rounded-full px-2.5 py-0.5 text-xs font-medium " +
              (adzunaConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
            }
          >
            {adzunaConnected ? t.settings.connected : t.settings.pending}
          </span>
        </div>
        {adzunaConnected ? (
          <AdzunaSync />
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            {t.settings.connectHelpPrefix}{" "}
            <code className="rounded bg-slate-100 px-1">ADZUNA_APP_ID</code>{" "}
            {t.settings.andWord}{" "}
            <code className="rounded bg-slate-100 px-1">ADZUNA_APP_KEY</code>{" "}
            {t.settings.connectHelpSuffix}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <div>
            <div className="text-sm font-medium text-slate-800">RemoteOK</div>
            <div className="text-xs text-slate-500">{t.settings.remoteOkConnected}</div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            {t.settings.connected}
          </span>
        </div>
        <RemoteOkSync />

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Remotive</div>
            <div className="text-xs text-slate-500">{t.settings.remotiveConnected}</div>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            {t.settings.connected}
          </span>
        </div>
        <RemotiveSync />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t.settings.language}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{t.settings.languageNote}</p>
        <p className="mt-1 text-xs text-slate-400">ES / EN — {lang === "en" ? "English" : "Español"}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t.settings.teamAccess}
        </h2>
        <div className="mt-3 divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="font-medium text-slate-800">{u.full_name ?? u.email}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                {u.role}
              </span>
            </div>
          ))}
          {users.length === 0 && (
            <p className="py-2 text-sm text-slate-500">{t.settings.noUsersYet}</p>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {t.settings.domainNotePrefix}{" "}
          <code className="rounded bg-slate-100 px-1">allowed_domains</code> {t.settings.domainNoteSuffix}
        </p>
      </div>
    </div>
  );
}
