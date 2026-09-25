"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { findOrCreateCompany, createManualSignal } from "@/lib/queries";
import { notifyTeamOfHighPrioritySignal } from "@/lib/email";
import type { Technology, SignalType, SignalPriority, WorkMode } from "@/lib/types";

export async function createManualSignalAction(formData: FormData) {
  const session = await auth();

  const companyName = String(formData.get("companyName") ?? "").trim();
  const companyDomain = String(formData.get("companyDomain") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const technology = String(formData.get("technology") ?? "") as Technology;
  const signalType = String(formData.get("signalType") ?? "vacante_publicada") as SignalType;
  const priority = String(formData.get("priority") ?? "media") as SignalPriority;
  const workMode = String(formData.get("workMode") ?? "remoto") as WorkMode;
  const location = String(formData.get("location") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const rawText = String(formData.get("rawText") ?? "").trim();
  const originLabel = String(formData.get("originLabel") ?? "LinkedIn").trim();

  if (!companyName || !title || !technology) {
    throw new Error("Falta empresa, título de la señal o tecnología.");
  }

  const companyId = await findOrCreateCompany({
    name: companyName,
    domain: companyDomain || null,
    linkedin_url: originLabel === "LinkedIn" ? sourceUrl || null : null,
  });

  const signalId = await createManualSignal({
    companyId,
    title,
    technology,
    signalType,
    priority,
    workMode,
    location: location || null,
    sourceUrl: sourceUrl || null,
    rawText: rawText || null,
    createdBy: session?.user?.id ?? null,
    originLabel: originLabel || null,
  });

  if (priority === "alta") {
    await notifyTeamOfHighPrioritySignal({
      signalId,
      companyName,
      technology,
      title,
      reason: "cargada",
    });
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(`/leads/${signalId}`);
}
