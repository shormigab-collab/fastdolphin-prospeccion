// ---------------------------------------------------------------------------
// Integración con Adzuna (https://developer.adzuna.com) — un agregador de
// bolsas de empleo con búsqueda real por palabra clave, capa gratis
// (cientos de consultas/día con solo registrarse, sin tarjeta), y cobertura
// en EE.UU., Canadá y varios países más.
//
// A diferencia de Apollo.io (que solo compara el PERFIL de la empresa con
// una tecnología, sin saber si de verdad están contratando), esto devuelve
// vacantes reales publicadas hoy: título, empresa y link directo a la
// publicación. Por eso las señales que crea entran ya con prioridad alta y
// marcadas como "vacante confirmada" — no es una corazonada, es una
// vacante que existe de verdad ahora mismo.
//
// Limitación honesta: Adzuna no siempre indica de forma confiable si el
// puesto es remoto — se usa una heurística (buscar "remote"/"remoto" en el
// título y la ubicación) para decidir el work_mode. Si no encuentra esa
// palabra, se guarda como "presencial" — lo cual, con la política de
// prospección de Fast Dolphin (solo remoto, o presencial/híbrido en México
// o Brasil), simplemente hace que esa señal no aparezca por defecto en
// Señales / Leads a menos que se elija "ver todas". Eso es lo correcto:
// mejor ocultarla por defecto que asumir que es remota sin evidencia.
// ---------------------------------------------------------------------------

import type { Technology } from "@/lib/types";
import { TITLE_KEYWORDS } from "@/lib/jobBoards";
import { mentionsNearshore } from "@/lib/nearshore";

const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

export function isAdzunaConnected() {
  return !!APP_ID && !!APP_KEY;
}

export type AdzunaCountry = "us" | "ca";

export const ADZUNA_COUNTRIES: { value: AdzunaCountry; label: string }[] = [
  { value: "us", label: "Estados Unidos" },
  { value: "ca", label: "Canadá" },
];

export interface AdzunaSignalCandidate {
  companyName: string;
  title: string;
  url: string;
  location: string | null;
  workMode: "remoto" | "presencial";
  technology: Technology;
  // Coincidencia de texto (título/ubicación/descripción) con palabras como
  // "nearshore" o "LatAm" — ver @/lib/nearshore. No es un dato que Adzuna
  // clasifique, es una búsqueda de palabras clave hecha acá.
  mentionsNearshore: boolean;
}

export interface AdzunaSyncResult {
  candidates: AdzunaSignalCandidate[];
  error?: string;
}

const REMOTE_HINTS = ["remote", "remoto", "work from home", "teletrabajo", "trabajo remoto"];

function looksRemote(title: string, location: string | null, description: string | null) {
  const haystack = `${title} ${location ?? ""} ${description ?? ""}`.toLowerCase();
  return REMOTE_HINTS.some((hint) => haystack.includes(hint));
}

export async function fetchAdzunaJobs(
  technology: Technology,
  country: AdzunaCountry,
  page = 1,
  resultsPerPage = 20
): Promise<AdzunaSyncResult> {
  if (!APP_ID || !APP_KEY) {
    return { candidates: [], error: "No hay ADZUNA_APP_ID / ADZUNA_APP_KEY configuradas." };
  }

  const keywords = TITLE_KEYWORDS[technology] ?? [technology];

  try {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
    url.searchParams.set("app_id", APP_ID);
    url.searchParams.set("app_key", APP_KEY);
    url.searchParams.set("results_per_page", String(resultsPerPage));
    // what_or busca cualquiera de estas palabras (OR), no todas a la vez —
    // así "SAP" o "S/4HANA" en el título ya cuentan como coincidencia.
    url.searchParams.set("what_or", keywords.join(" "));
    url.searchParams.set("content-type", "application/json");

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && (data.exception || data.display)) || `Adzuna respondió ${res.status} ${res.statusText}`;
      return { candidates: [], error: String(message) };
    }

    const results: Array<Record<string, unknown>> = (data?.results as Array<Record<string, unknown>>) ?? [];

    const candidates: AdzunaSignalCandidate[] = results
      .filter((r) => {
        const company = r.company as { display_name?: string } | undefined;
        return !!r.redirect_url && !!company?.display_name;
      })
      .map((r) => {
        const company = r.company as { display_name?: string };
        const location = r.location as { display_name?: string } | undefined;
        const title = String(r.title ?? "Vacante sin título").replace(/<[^>]+>/g, "");
        const description = r.description ? String(r.description) : null;
        return {
          companyName: company.display_name!,
          title,
          url: String(r.redirect_url),
          location: location?.display_name ?? null,
          workMode: looksRemote(title, location?.display_name ?? null, description)
            ? ("remoto" as const)
            : ("presencial" as const),
          technology,
          mentionsNearshore: mentionsNearshore(title, location?.display_name, description),
        };
      });

    return { candidates };
  } catch (err) {
    return {
      candidates: [],
      error: err instanceof Error ? err.message : "Error desconocido llamando a Adzuna.",
    };
  }
}
