"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateOutreachDraft, generateEmailSubject } from "@/lib/suggestions";
import {
  getSignalById,
  insertMessageDraft,
  updateMessageDraft,
  approveMessage as approveMessageQuery,
  markMessageSent,
  discardMessage as discardMessageQuery,
  updateSignalStatus,
  addNote as addNoteQuery,
  confirmVacancy,
  updateCompanyCareersUrl,
} from "@/lib/queries";
import { notifyTeamOfHighPrioritySignal } from "@/lib/email";
import type { SignalStatus } from "@/lib/types";

export async function generateDraftAction(
  signalId: string,
  channel: "linkedin" | "email" = "linkedin"
) {
  const signal = await getSignalById(signalId);
  if (!signal) return;

  const draft = generateOutreachDraft(signal, signal.company?.name ?? "la empresa");
  const subject = channel === "email" ? generateEmailSubject(signal.technology) : null;
  await insertMessageDraft({ signalId, draftText: draft, channel, subject });

  revalidatePath(`/leads/${signalId}`);
}

export async function updateDraftAction(
  messageId: string,
  signalId: string,
  params: { draftText: string; subject?: string | null }
) {
  await updateMessageDraft(messageId, params);
  revalidatePath(`/leads/${signalId}`);
}

export async function approveMessageAction(messageId: string, signalId: string) {
  const session = await auth();
  await approveMessageQuery(messageId, session?.user?.id ?? null);
  revalidatePath(`/leads/${signalId}`);
}

export async function markSentAction(messageId: string, signalId: string) {
  await markMessageSent(messageId, signalId);
  revalidatePath(`/leads/${signalId}`);
}

export async function discardMessageAction(messageId: string, signalId: string) {
  await discardMessageQuery(messageId);
  revalidatePath(`/leads/${signalId}`);
}

export async function updateStatusAction(signalId: string, status: SignalStatus) {
  await updateSignalStatus(signalId, status);
  revalidatePath(`/leads/${signalId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function addNoteAction(signalId: string, body: string) {
  if (!body.trim()) return;
  const session = await auth();
  await addNoteQuery({ signalId, authorId: session?.user?.id ?? null, body });
  revalidatePath(`/leads/${signalId}`);
}

// Lógica compartida de "confirmar vacante": sube la señal a prioridad alta,
// deja constancia en las notas (para que salga en "Actividad reciente"), y
// avisa por correo a todo el equipo si el envío de correos está configurado.
// `noteBody` deja poner un mensaje distinto según de dónde vino la
// confirmación (a mano, o porque se encontró de verdad en una bolsa de
// empleo pública).
async function doConfirmVacancy(signalId: string, noteBody: string) {
  const session = await auth();
  await confirmVacancy(signalId, session?.user?.id ?? null);
  await addNoteQuery({
    signalId,
    authorId: session?.user?.id ?? null,
    body: noteBody,
  });

  const signal = await getSignalById(signalId);
  if (signal) {
    await notifyTeamOfHighPrioritySignal({
      signalId: signal.id,
      companyName: signal.company?.name ?? "Empresa",
      technology: signal.technology,
      title: signal.title,
      reason: "confirmada",
    });
  }

  revalidatePath(`/leads/${signalId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

// "Confirmar vacante" — alguien del equipo verificó a mano que la vacante
// existe de verdad (Apollo, en el plan que tenemos, no puede confirmar
// esto).
export async function confirmVacancyAction(signalId: string) {
  await doConfirmVacancy(signalId, "Vacante confirmada manualmente — prioridad subida a alta.");
}

// Guarda el link de la bolsa de empleo pública (Greenhouse, Lever, etc.) de
// la empresa dueña de esta señal, para poder revisar automáticamente si
// tienen vacantes abiertas.
export async function saveCareersUrlAction(
  companyId: string,
  signalId: string,
  careersUrl: string
) {
  if (!careersUrl.trim()) return;
  await updateCompanyCareersUrl(companyId, careersUrl.trim());
  revalidatePath(`/leads/${signalId}`);
}

// Igual que "Confirmar vacante", pero disparado cuando la plataforma
// encontró la vacante de verdad en la bolsa de empleo pública de la
// empresa (Greenhouse/Lever) — queda registrado con el título y el link
// reales de la publicación, así queda clara la evidencia.
export async function confirmVacancyFromJobBoardAction(
  signalId: string,
  position: { title: string; url: string }
) {
  await doConfirmVacancy(
    signalId,
    `Vacante confirmada automáticamente — se encontró publicada en la bolsa de empleo de la empresa: "${position.title}" (${position.url}).`
  );
}
