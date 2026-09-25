// ---------------------------------------------------------------------------
// Integración con Remotive (https://remotive.com/api/remote-jobs) — otra
// bolsa de empleo 100% remoto, con API pública, gratis y sin necesidad de
// llave. A diferencia de RemoteOK, sí soporta búsqueda por palabra clave del
// lado del servidor (parámetro "search"), así que no hace falta descargar
// el feed completo y filtrar aquí.
//
// Límite honesto que pide Remotive: usar la API con moderación (ellos
// sugieren no más de ~4 llamadas al día). Esta integración no fuerza ese
// límite por software — como el resto de sincronizaciones de esta
// plataforma, depende de que el equipo le dé "Sincronizar ahora" a mano y
// no en loop, así que en el uso normal (unas cuantas veces al día,
// eligiendo tecnología) se respeta solo. Ver nota en el README.
//
// Como Remotive es exclusivamente para trabajo remoto, cada señal entra con
// work_mode = 'remoto' sin necesitar ninguna heurística.
// ---------------------------------------------------------------------------

import type { Technology } from "@/lib/types";
import { TITLE_KEYWORDS } from "@/lib/jobBoards";
import { mentionsNearshore } from "@/lib/nearshore";

export function isRemotiveConnected() {
  // No requiere llave ni registro — siempre disponible.
  return true;
}

export interface RemotiveSignalCandidate {
  companyName: string;
  title: string;
  url: string;
  location: string | null;
  technology: Technology;
  // Ver @/lib/nearshore — coincidencia de texto, no un dato que Remotive
  // clasifique.
  mentionsNearshore: boolean;
}

export interface RemotiveSyncResult {
  candidates: RemotiveSignalCandidate[];
  error?: string;
}

interface RemotiveJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  description?: string; // HTML — solo se usa para buscar palabras clave, no se guarda
}

// Remotive solo acepta un término de búsqueda por llamada — se usa la
// primera palabra clave de cada tecnología (la más representativa) en vez
// de hacer una llamada por cada sinónimo, para no gastar de más la cuota
// diaria sugerida.
export async function fetchRemotiveJobs(
  technology: Technology,
  limit = 30
): Promise<RemotiveSyncResult> {
  const keywords = TITLE_KEYWORDS[technology] ?? [technology];
  const searchTerm = keywords[0];

  try {
    const url = new URL("https://remotive.com/api/remote-jobs");
    url.searchParams.set("search", searchTerm);
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      return { candidates: [], error: `Remotive respondió ${res.status} ${res.statusText}` };
    }

    const data = (await res.json().catch(() => null)) as { jobs?: RemotiveJob[] } | null;
    const jobs = data?.jobs ?? [];

    const candidates: RemotiveSignalCandidate[] = jobs
      .filter((j) => !!j.url && !!j.company_name && !!j.title)
      .map((j) => ({
        companyName: j.company_name!,
        title: j.title!,
        url: j.url!,
        location: j.candidate_required_location || null,
        technology,
        mentionsNearshore: mentionsNearshore(j.title, j.candidate_required_location, j.description),
      }));

    return { candidates };
  } catch (err) {
    return {
      candidates: [],
      error: err instanceof Error ? err.message : "Error desconocido llamando a Remotive.",
    };
  }
}
