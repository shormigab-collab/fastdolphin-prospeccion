import { listUsers } from "@/lib/queries";
import { isApolloConnected } from "@/lib/apollo";
import { ApolloSync } from "@/components/ApolloSync";

export default async function SettingsPage() {
  const users = await listUsers();
  const apolloConnected = isApolloConnected();

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Fuentes de señales
        </h2>
        <div className="mt-3 flex items-center justify-between rounded-md bg-slate-50 p-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Apollo.io</div>
            <div className="text-xs text-slate-500">
              {apolloConnected
                ? "Conectado — sincronizando señales automáticamente."
                : "No conectada todavía. Mientras tanto, la app usa datos de ejemplo y carga manual."}
            </div>
          </div>
          <span
            className={
              "rounded-full px-2.5 py-0.5 text-xs font-medium " +
              (apolloConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
            }
          >
            {apolloConnected ? "Conectado" : "Pendiente"}
          </span>
        </div>
        {apolloConnected ? (
          <ApolloSync />
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Para conectarla, agrega <code className="rounded bg-slate-100 px-1">APOLLO_API_KEY</code>{" "}
            en las variables de entorno de Vercel (ver README del proyecto).
          </p>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Equipo con acceso
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
            <p className="py-2 text-sm text-slate-500">Aún no hay usuarios registrados.</p>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Solo se pueden crear cuentas con correo del dominio configurado en{" "}
          <code className="rounded bg-slate-100 px-1">allowed_domains</code> (por
          defecto, fastdolphin.com).
        </p>
      </div>
    </div>
  );
}
