"use server";

import { revalidatePath } from "next/cache";
import { deleteSignal } from "@/lib/queries";

// Elimina una señal (y, en cascada, sus mensajes y notas). La confirmación
// de "¿seguro?" vive en el cliente, en DeleteSignalButton, antes de llamar
// esta acción — aquí ya se ejecuta sin volver a preguntar.
export async function deleteSignalAction(signalId: string) {
  await deleteSignal(signalId);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
