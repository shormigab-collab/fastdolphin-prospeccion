import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  fetchAdzunaJobs,
  fetchAdzunaNearshoreJobs,
  isAdzunaConnected,
  ADZUNA_COUNTRIES,
  type AdzunaCountry,
} from "@/lib/adzuna";
import { ALL_TECHNOLOGIES } from "@/lib/apollo";
import {
  findOrCreateCompany,
  findSignalBySourceUrl,
  createJobFeedSignal,
  insertMessageDraft,
  countSignalsForTechnologyBySource,
} from "@/lib/queries";
import { generateOutreachDraft } from "@/lib/suggestions";
import type { Technology } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!isAdzunaConnected()) {
    return NextResponse.json(
      { error: "Falta configurar ADZUNA_APP_ID / ADZUNA_APP_KEY en las variables de entorno de Vercel." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === "nearshore" ? "nearshore" : "technology";
  const technology = body?.technology as Technology | undefined;
  const country = body?.country as AdzunaCountry | undefined;

  if (mode === "technology" && (!technology || !ALL_TECHNOLOGIES.includes(technology))) {
    return NextResponse.json({ error: "Selecciona una tecnología válida." }, { status: 400 });
  }

  if (!country || !ADZUNA_COUNTRIES.some((c) => c.value === country)) {
    return NextResponse.json({ error: "Selecciona un país válido." }, { status: 400 });
  }

  const PAGE_SIZE = 20;

  let candidates: Awaited<ReturnType<typeof fetchAdzunaJobs>>["candidates"];
  let error: string | undefined;

  if (mode === "nearshore") {
    // Búsqueda directa por "nearshore"/"latam", no por tecnología — no hay
    // una tecnología elegida contra la cual contar resultados previos, así
    // que siempre se pide la primera página; el filtro por URL ya existente
    // más abajo evita repetir señales entre una búsqueda y la siguiente.
    ({ candidates, error } = await fetchAdzunaNearshoreJobs(country, 1, PAGE_SIZE));
  } else {
    // Igual que con Apollo: cada sincronización avanza a la siguiente
    // "página" de resultados de Adzuna para esta tecnología, para no traer
    // siempre las mismas vacantes. La cuenta incluye señales de Adzuna de
    // cualquier país para esta tecnología — una aproximación razonable, ya
    // que lo importante es no quedarse pegado en los mismos resultados.
    const existingCount = await countSignalsForTechnologyBySource(technology as Technology, "adzuna");
    const page = Math.floor(existingCount / PAGE_SIZE) + 1;
    ({ candidates, error } = await fetchAdzunaJobs(technology as Technology, country, page, PAGE_SIZE));
  }

  if (error) {
    // Mensaje real de Adzuna (llaves inválidas, límite alcanzado, etc.) — se
    // muestra tal cual en Configuración.
    return NextResponse.json({ error }, { status: 502 });
  }

  let created = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    // Vacantes reales publicadas ahora mismo — a diferencia de Apollo, cada
    // una tiene su propio link, así que el duplicado se checa por URL de la
    // vacante (no por empresa+tecnología): una misma empresa puede tener
    // varias vacantes abiertas de verdad a la vez.
    const existingSignalId = await findSignalBySourceUrl(candidate.url);
    if (existingSignalId) {
      skipped++;
      continue;
    }

    const companyId = await findOrCreateCompany({
      name: candidate.companyName,
    });

    const signalId = await createJobFeedSignal({
      source: "adzuna",
      companyId,
      title: candidate.title,
      technology: candidate.technology,
      sourceUrl: candidate.url,
      location: candidate.location,
      workMode: candidate.workMode,
      mentionsNearshore: candidate.mentionsNearshore,
    });

    const draft = generateOutreachDraft(
      { technology: candidate.technology, signal_type: "vacante_publicada" },
      candidate.companyName
    );
    await insertMessageDraft({ signalId, draftText: draft });

    created++;
  }

  // A diferencia del flujo de "Confirmar vacante" (una señal a la vez), aquí
  // no se notifica por correo al equipo — evita saturar bandejas de entrada
  // cuando una sincronización trae varias señales de golpe. Mismo criterio
  // que ya se usa en la sincronización masiva de Apollo.
  return NextResponse.json({ ok: true, created, skipped, total: candidates.length });
}
