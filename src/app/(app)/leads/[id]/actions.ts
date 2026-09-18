"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateOutreachDraft } from "@/lib/suggestions";
import {
  getSignalById,
  insertMessageDraft,
  approveMessage as approveMessageQuery,
  markMessageSent,
  discardMessage as discardMessageQuery,
  updateSignalStatus,
  addNote as addNoteQuery,
} from "@/lib/queries";
import type { SignalStatus } from "@/lib/types";

export async function generateDraftAction(signalId: string) {
  const signal = await getSignalById(signalId);
  if (!signal) return;

  const draft = generateOutreachDraft(signal, signal.company?.name ?? "la empresa");
  await insertMessageDraft({ signalId, draftText: draft });

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
