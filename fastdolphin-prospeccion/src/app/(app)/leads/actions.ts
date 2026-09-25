"use server";

import { revalidatePath } from "next/cache";
import {
  deleteSignal,
  bulkAssignSignals,
  bulkUpdateStatus,
  bulkScheduleFollowUp,
} from "@/lib/queries";
import type { SignalStatus } from "@/lib/types";

// Elimina una señal (y, en cascada, sus mensajes y notas). La confirmación
// de "¿seguro?" vive en el cliente, en DeleteSignalButton, antes de llamar
// esta acción — aquí ya se ejecuta sin volver a preguntar.
export async function deleteSignalAction(signalId: string) {
  await deleteSignal(signalId);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

// Las tres acciones en lote de la barra de selección de /leads — reciben
// los ids de TODAS las señales visibles de las empresas marcadas (no solo
// una por empresa), para que aplicar en lote afecte lo que de verdad se ve
// en pantalla.
export async function bulkAssignAction(signalIds: string[], userId: string | null) {
  await bulkAssignSignals(signalIds, userId);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
}

export async function bulkStatusAction(signalIds: string[], status: SignalStatus) {
  await bulkUpdateStatus(signalIds, status);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
}

export async function bulkFollowUpAction(
  signalIds: string[],
  date: string | null,
  note: string | null
) {
  await bulkScheduleFollowUp(signalIds, date, note);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
}
