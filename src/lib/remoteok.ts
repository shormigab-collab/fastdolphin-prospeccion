// ---------------------------------------------------------------------------
// Integración con RemoteOK (https://remoteok.com/api) — una bolsa de empleo
// 100% remoto, con un feed JSON público, gratis, y SIN necesidad de
// registrarse ni de llave de API. A diferencia de Adzuna, no hay nada que
// configurar: funciona apenas se hace la primera sincronización.
//
// El feed completo (unos cientos de vacantes activas) se descarga entero en
// cada llamada — no hay parámetro de búsqueda por palabra clave del lado
// del servidor, así que el filtrado por tecnología se hace aquí, comparando
// el título y las etiquetas (tags) de cada vacante contra TITLE_KEYWORDS.
//
// El primer elemento del arreglo que devuelve la API es un aviso legal, no
// una vacante — se descarta. RemoteOK pide, como condición de uso del feed,
// enlazar de vuelta a la publicación original; como cada señal ya guarda el
// link directo (source_url), esa condición queda cubierta sola.
//
// Como RemoteOK es exclusivamente para trabajo remoto, cada señal entra con
// work_mode = 'remoto' sin necesitar ninguna heurística.
// ---------------------------------------------------------------------------

import type { Technology } from "@/lib/types";
import { TITLE_KEYWORDS, classifyTechnology } from "@/lib/jobBoards";
import { mentionsNearshore } from "@/lib/nearshore";

export function isRemoteOkConnected() {
  // No requiere llave ni registro — siempre disponible.
  return true;
}

export interface RemoteOkSignalCandidate {
  companyName: string;
  title: string;
  url: string;
  location: string | null;
  technology: Technology;
  // Ver @/lib/nearshore — coincidencia de texto, no un dato que RemoteOK
  // clasifique.
  mentionsNearshore: boolean;
}

export interface RemoteOkSyncResult {
  candidates: RemoteOkSignalCandidate[];
  error?: string;
}

interface RemoteOkJob {
  id?: string | number;
  slug?: string;
  company?: string;
  position?: string;
  tags?: string[];
  location?: string;
  url?: string;
  apply_url?: string;
  description?: string; // HTML — solo se usa para buscar palabras clave, no se guarda
  legal?: string; // solo presente en el primer elemento (aviso legal)
}

export async function fetchRemoteOkJobs(technology: Technology): Promise<RemoteOkSyncResult> {
  const keywords = (TITLE_KEYWORDS[technology] ?? [technology]).map((k) => k.toLowerCase());

  try {
    const res = await fetch("https://remoteok.com/api", {
      cache: "no-store",
      headers: { "User-Agent": "FastDolphinProspeccion/1.0 (+https://fastdolphin.com)" },
    });

    if (!res.ok) {
      return { candidates: [], error: `RemoteOK respondió ${res.status} ${res.statusText}` };
    }

    const data = (await res.json().catch(() => null)) as RemoteOkJob[] | null;
    if (!Array.isArray(data)) {
      return { candidates: [], error: "RemoteOK devolvió una respuesta con un formato inesperado." };
    }

    // El primer elemento es el aviso legal del feed, no una vacante.
    const jobs = data.filter((j) => !j.legal && j.position && j.company);

    const candidates: RemoteOkSignalCandidate[] = jobs
      .filter((j) => {
        const haystack = `${j.position} ${(j.tags ?? []).join(" ")}`.toLowerCase();
        return keywords.some((k) => haystack.includes(k));
      })
      .filter((j) => !!(j.url || j.apply_url))
      .map((j) => ({
        companyName: j.company!,
        title: j.position!,
        url: String(j.apply_url || j.url),
        location: j.location || null,
        technology,
        mentionsNearshore: mentionsNearshore(j.position, j.location, (j.tags ?? []).join(" "), j.description),
      }));

    return { candidates };
  } catch (err) {
    return {
      candidates: [],
      error: err instanceof Error ? err.message : "Error desconocido llamando a RemoteOK.",
    };
  }
}

// Como RemoteOK ya descarga el feed completo (no hay búsqueda del lado del
// servidor), buscar "posible nearshore" es simplemente filtrar ese mismo
// feed por las palabras de @/lib/nearshore en vez de por TITLE_KEYWORDS de
// una tecnología elegida — y clasificar cada resultado en una tecnología
// después (ver classifyTechnology), descartando lo que no calce en ninguna
// de las 9 del esquema.
export async function fetchRemoteOkNearshoreJobs(): Promise<RemoteOkSyncResult> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      cache: "no-store",
      headers: { "User-Agent": "FastDolphinProspeccion/1.0 (+https://fastdolphin.com)" },
    });

    if (!res.ok) {
      return { candidates: [], error: `RemoteOK respondió ${res.status} ${res.statusText}` };
    }

    const data = (await res.json().catch(() => null)) as RemoteOkJob[] | null;
    if (!Array.isArray(data)) {
      return { candidates: [], error: "RemoteOK devolvió una respuesta con un formato inesperado." };
    }

    const jobs = data.filter((j) => !j.legal && j.position && j.company);

    const candidates: RemoteOkSignalCandidate[] = jobs
      .filter((j) => mentionsNearshore(j.position, j.location, (j.tags ?? []).join(" "), j.description))
      .filter((j) => !!(j.url || j.apply_url))
      .map((j) => ({
        companyName: j.company!,
        title: j.position!,
        url: String(j.apply_url || j.url),
        location: j.location || null,
        technology: classifyTechnology(j.position!, `${(j.tags ?? []).join(" ")} ${j.description ?? ""}`),
      }))
      .filter((c): c is typeof c & { technology: Technology } => c.technology !== null)
      .map((c) => ({ ...c, mentionsNearshore: true }));

    return { candidates };
  } catch (err) {
    return {
      candidates: [],
      error: err instanceof Error ? err.message : "Error desconocido llamando a RemoteOK.",
    };
  }
}
