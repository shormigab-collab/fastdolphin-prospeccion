"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLink } from "@/components/icons";

interface InitialContact {
  name: string | null;
  title: string | null;
  email: string | null;
  emailStatus: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  apolloId: string | null;
  lookedUpAt: string | null;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function contactStatusPill(contact: InitialContact) {
  if (!contact.email) {
    return { label: "Sin correo", className: "bg-slate-100 text-slate-500" };
  }
  if (contact.emailStatus === "verified") {
    return { label: "Correo verificado", className: "bg-emerald-50 text-emerald-700" };
  }
  return { label: "Correo por verificar", className: "bg-amber-50 text-amber-700" };
}

export function ContactLookup({
  signalId,
  apolloConnected,
  initialContact,
}: {
  signalId: string;
  apolloConnected: boolean;
  initialContact: InitialContact;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const hasContact = !!initialContact.name;

  async function handleLookup() {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await fetch("/api/apollo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? "No se pudo buscar el contacto en Apollo.io.");
      } else if (!body.found) {
        setNotFound(true);
      } else {
        if (body.warning) setError(body.warning);
        router.refresh();
      }
    } catch {
      setError("No se pudo conectar con Apollo.io. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const statusPill = hasContact ? contactStatusPill(initialContact) : null;
  const apolloUrl = initialContact.apolloId
    ? `https://app.apollo.io/#/people/${initialContact.apolloId}`
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Contacto
        </h2>
        {apolloConnected ? (
          <button
            onClick={handleLookup}
            disabled={loading}
            className="shrink-0 rounded-xl bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
          >
            {loading ? "Buscando..." : hasContact ? "Buscar de nuevo" : "Buscar contacto"}
          </button>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Apollo no conectado
          </span>
        )}
      </div>

      {hasContact ? (
        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dolphin-100 text-sm font-semibold text-dolphin-700">
            {initialsOf(initialContact.name!) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{initialContact.name}</p>
            <p className="text-sm text-slate-500">
              {initialContact.title ?? "Cargo sin especificar"}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {statusPill && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPill.className}`}>
                  {statusPill.label}
                </span>
              )}
              {apolloUrl && (
                <a
                  href={apolloUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-medium text-ink hover:bg-slate-50"
                >
                  <IconLink className="h-3 w-3" />
                  Ver contacto en Apollo
                </a>
              )}
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <p className="text-slate-600">
                Correo:{" "}
                {initialContact.email ? (
                  <a
                    href={`mailto:${initialContact.email}`}
                    className="text-dolphin-600 hover:underline"
                  >
                    {initialContact.email}
                  </a>
                ) : (
                  <span className="text-slate-400">no disponible</span>
                )}
              </p>
              <p className="text-slate-600">
                Teléfono:{" "}
                {initialContact.phone ? (
                  initialContact.phone
                ) : (
                  <span className="text-slate-400">
                    no disponible (Apollo suele no entregarlo en planes básicos)
                  </span>
                )}
              </p>
              {initialContact.linkedinUrl && (
                <a
                  href={initialContact.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-dolphin-600 hover:underline"
                >
                  Ver LinkedIn ↗
                </a>
              )}
            </div>
            {initialContact.lookedUpAt && (
              <p className="mt-2 text-xs text-slate-400">
                Buscado el {new Date(initialContact.lookedUpAt).toLocaleDateString("es-MX")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          {apolloConnected
            ? "Aún no se ha buscado un contacto para esta señal. Busca a alguien de RRHH/Talent Acquisition en Apollo.io."
            : "Conecta Apollo.io en Configuración para poder buscar contactos."}
        </p>
      )}

      {notFound && (
        <p className="mt-2 text-sm text-amber-700">
          No se encontró ningún contacto de RRHH/Talent Acquisition en Apollo.io para esta
          empresa.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
