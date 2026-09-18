import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchApolloSignals, isApolloConnected, ALL_TECHNOLOGIES } from "@/lib/apollo";
import {
  findOrCreateCompany,
  findApolloSignalForCompany,
  createApolloSignal,
  insertMessageDraft,
  countApolloSignalsForTechnology,
} from "@/lib/queries";
import { generateOutreachDraft } from "@/lib/suggestions";
import type { Technology } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!isApolloConnected()) {
    return NextResponse.json(
      { error: "Falta configurar APOLLO_API_KEY en las variables de entorno de Vercel." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const technology = body?.technology as Technology | undefined;

  if (!technology || !ALL_TECHNOLOGIES.includes(technology)) {
    return NextResponse.json({ error: "Selecciona una tecnología válida." }, { status: 400 });
  }

  // Cada sincronización avanza a la siguiente "página" de resultados de
  // Apollo para esta tecnología (en vez de pedir siempre las mismas
  // primeras empresas) — la página se calcula a partir de cuántas señales
  // de Apollo ya existen para esta tecnología. Es una aproximación (algunas
  // empresas de una página se pueden saltar por duplicado), pero evita que
  // el equipo se quede viendo siempre el mismo puñado de empresas.
  const PAGE_SIZE = 20;
  const existingCount = await countApolloSignalsForTechnology(technology);
  const page = Math.floor(existingCount / PAGE_SIZE) + 1;

  const { candidates, error } = await fetchApolloSignals(technology, PAGE_SIZE, page);

  if (error) {
    // Mensaje real de Apollo.io (clave inválida, endpoint no incluido en el
    // plan, límite alcanzado, etc.) — se muestra tal cual en Configuración.
    return NextResponse.json({ error }, { status: 502 });
  }

  let created = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const companyId = await findOrCreateCompany({
      name: candidate.companyName,
      domain: candidate.companyDomain ?? null,
      linkedin_url: candidate.sourceUrl ?? null,
    });

    const existingSignalId = await findApolloSignalForCompany(companyId, candidate.technology);
    if (existingSignalId) {
      skipped++;
      continue;
    }

    const signalId = await createApolloSignal({
      companyId,
      title: candidate.title,
      technology: candidate.technology,
      sourceUrl: candidate.sourceUrl ?? null,
      workMode: "remoto",
      rawText:
        "Modalidad y ubicación de la vacante sin confirmar por Apollo.io — verificar con la empresa antes de contactar.",
    });

    const draft = generateOutreachDraft(
      { technology: candidate.technology, signal_type: "tecnologia_detectada" },
      candidate.companyName
    );
    await insertMessageDraft({ signalId, draftText: draft });

    created++;
  }

  return NextResponse.json({ ok: true, created, skipped, total: candidates.length });
}
