"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLink, IconPencil } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";
import { updateContactAction } from "@/app/(app)/leads/[id]/actions";

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

interface ContactCandidate {
  apolloId: string;
  name: string;
  title: string | null;
  linkedinUrl: string | null;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
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
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [candidates, setCandidates] = useState<ContactCandidate[] | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initialContact.name ?? "",
    title: initialContact.title ?? "",
    email: initialContact.email ?? "",
    phone: initialContact.phone ?? "",
    linkedinUrl: initialContact.linkedinUrl ?? "",
  });

  const hasContact = !!initialContact.name;

  function contactStatusPill(contact: InitialContact) {
    if (!contact.email) {
      return { label: t.contact.noEmail, className: "bg-slate-100 text-slate-500" };
    }
    if (contact.emailStatus === "verified") {
      return { label: t.contact.emailVerified, className: "bg-emerald-50 text-emerald-700" };
    }
    return { label: t.contact.emailToVerify, className: "bg-amber-50 text-amber-700" };
  }

  async function handleLookup() {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setCandidates(null);

    try {
      const res = await fetch("/api/apollo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId, action: "search" }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? t.contact.genericError);
      } else if (!body.candidates || body.candidates.length === 0) {
        setNotFound(true);
      } else {
        setCandidates(body.candidates);
      }
    } catch {
      setError(t.contact.connectionError);
    } finally {
      setLoading(false);
    }
  }

  // Segundo paso: alguien del equipo ya eligió a la persona correcta de la
  // lista — recién acá se gasta 1 crédito de Apollo revelando su correo, y
  // se guarda como el contacto de la señal.
  async function handleReveal(candidate: ContactCandidate) {
    setRevealingId(candidate.apolloId);
    setError(null);

    try {
      const res = await fetch("/api/apollo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId,
          action: "reveal",
          apolloId: candidate.apolloId,
          name: candidate.name,
          title: candidate.title,
          linkedinUrl: candidate.linkedinUrl,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? t.contact.genericError);
      } else if (!body.found) {
        setNotFound(true);
        setCandidates(null);
      } else {
        if (body.warning) setError(body.warning);
        setCandidates(null);
        router.refresh();
      }
    } catch {
      setError(t.contact.connectionError);
    } finally {
      setRevealingId(null);
    }
  }

  function openEdit() {
    setForm({
      name: initialContact.name ?? "",
      title: initialContact.title ?? "",
      email: initialContact.email ?? "",
      phone: initialContact.phone ?? "",
      linkedinUrl: initialContact.linkedinUrl ?? "",
    });
    setError(null);
    setCandidates(null);
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateContactAction(signalId, form);
      setEditing(false);
      router.refresh();
    } catch {
      setError(t.contact.genericError);
    } finally {
      setSaving(false);
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
          {t.contact.title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {!editing && (
            <button
              onClick={openEdit}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
            >
              <IconPencil className="h-3.5 w-3.5" />
              {hasContact ? t.contact.editButton : t.contact.addButton}
            </button>
          )}
          {apolloConnected && !editing && (
            <button
              onClick={handleLookup}
              disabled={loading}
              className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {loading ? t.contact.searching : hasContact ? t.contact.searchAgain : t.contact.searchContact}
            </button>
          )}
          {!apolloConnected && !editing && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {t.contact.apolloNotConnected}
            </span>
          )}
        </div>
      </div>

      {!editing && candidates && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500">{t.contact.candidatesTitle}</p>
            <button
              onClick={() => setCandidates(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              {t.contact.closeCandidates}
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {candidates.map((c) => (
              <li
                key={c.apolloId}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {c.title ?? t.contact.unspecifiedRole}
                  </p>
                  {c.linkedinUrl && (
                    <a
                      href={c.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-dolphin-600 hover:underline"
                    >
                      {t.contact.viewLinkedin}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleReveal(c)}
                  disabled={revealingId !== null}
                  className="shrink-0 rounded-xl bg-dolphin-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
                >
                  {revealingId === c.apolloId ? t.contact.revealing : t.contact.useThisContact}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t.contact.fieldName}</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-ink focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t.contact.fieldTitle}</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-ink focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t.contact.fieldEmail}</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-ink focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">{t.contact.fieldPhone}</span>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-ink focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-500">{t.contact.fieldLinkedin}</span>
              <input
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                placeholder="https://www.linkedin.com/in/..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm text-ink focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-dolphin-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
            >
              {saving ? t.contact.saving : t.contact.save}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-60"
            >
              {t.contact.cancel}
            </button>
          </div>
        </div>
      ) : hasContact ? (
        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dolphin-100 text-sm font-semibold text-dolphin-700">
            {initialsOf(initialContact.name!) || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{initialContact.name}</p>
            <p className="text-sm text-slate-500">
              {initialContact.title ?? t.contact.unspecifiedRole}
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
                  {t.contact.viewInApollo}
                </a>
              )}
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <p className="text-slate-600">
                {t.contact.emailLabel}{" "}
                {initialContact.email ? (
                  <a
                    href={`mailto:${initialContact.email}`}
                    className="text-dolphin-600 hover:underline"
                  >
                    {initialContact.email}
                  </a>
                ) : (
                  <span className="text-slate-400">{t.contact.notAvailable}</span>
                )}
              </p>
              <p className="text-slate-600">
                {t.contact.phoneLabel}{" "}
                {initialContact.phone ? (
                  initialContact.phone
                ) : (
                  <span className="text-slate-400">{t.contact.phoneUnavailable}</span>
                )}
              </p>
              {initialContact.linkedinUrl && (
                <a
                  href={initialContact.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-dolphin-600 hover:underline"
                >
                  {t.contact.viewLinkedin}
                </a>
              )}
            </div>
            {initialContact.lookedUpAt && (
              <p className="mt-2 text-xs text-slate-400">
                {t.contact.lookedUpOn(
                  new Date(initialContact.lookedUpAt).toLocaleDateString(lang === "en" ? "en-US" : "es-MX")
                )}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          {apolloConnected ? t.contact.noneYetConnected : t.contact.noneYetDisconnected}
        </p>
      )}

      {!editing && notFound && <p className="mt-2 text-sm text-amber-700">{t.contact.notFound}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
