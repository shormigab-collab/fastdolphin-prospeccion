"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InitialContact {
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  lookedUpAt: string | null;
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

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Contacto en la empresa
        </h2>
        {apolloConnected ? (
          <button
            onClick={handleLookup}
            disabled={loading}
            className="shrink-0 rounded-md bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
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
        <div className="mt-3 space-y-1 text-sm">
          <p className="font-medium text-slate-800">
            {initialContact.name}
            {initialContact.title ? ` · ${initialContact.title}` : ""}
          </p>
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
          {initialContact.lookedUpAt && (
            <p className="pt-1 text-xs text-slate-400">
              Buscado el {new Date(initialContact.lookedUpAt).toLocaleDateString("es-MX")}
            </p>
          )}
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
