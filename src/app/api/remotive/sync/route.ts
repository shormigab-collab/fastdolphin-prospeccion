import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchRemotiveJobs } from "@/lib/remotive";
import { ALL_TECHNOLOGIES } from "@/lib/apollo";
import {
  findOrCreateCompany,
  findSignalBySourceUrl,
  createJobFeedSignal,
  insertMessageDraft,
} from "@/lib/queries";
import { generateOutreachDraft } from "@/lib/suggestions";
import type { Technology } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const technology = body?.technology as Technology | undefined;

  if (!technology || !ALL_TECHNOLOGIES.includes(technology)) {
    return NextResponse.json({ error: "Selecciona una tecnología válida." }, { status: 400 });
  }

  // Remotive sugiere no llamar la API más de unas pocas veces al día — esta
  // ruta no lo fuerza por software (ver nota en README), así que el uso
  // esperado es el mismo botón "Sincronizar ahora" a mano que las demás
  // fuentes, no un job automático corriendo en loop.
  const { candidates, error } = await fetchRemotiveJobs(technology);

  if (error) {
    return NextResponse.json({ error }, { status: 502 });
  }

  let created = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const existingSignalId = await findSignalBySourceUrl(candidate.url);
    if (existingSignalId) {
      skipped++;
      continue;
    }

    const companyId = await findOrCreateCompany({ name: candidate.companyName });

    // Remotive es una bolsa exclusiva de trabajo remoto — no hace falta
    // ninguna heurística, work_mode siempre es 'remoto'.
    const signalId = await createJobFeedSignal({
      source: "remotive",
      companyId,
      title: candidate.title,
      technology: candidate.technology,
      sourceUrl: candidate.url,
      location: candidate.location,
      workMode: "remoto",
      mentionsNearshore: candidate.mentionsNearshore,
    });

    const draft = generateOutreachDraft(
      { technology: candidate.technology, signal_type: "vacante_publicada" },
      candidate.companyName
    );
    await insertMessageDraft({ signalId, draftText: draft });

    created++;
  }

  return NextResponse.json({ ok: true, created, skipped, total: candidates.length });
}
