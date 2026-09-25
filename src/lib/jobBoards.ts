// Revisa si una empresa tiene vacantes abiertas AHORA MISMO, consultando
// directamente la bolsa de empleo pública que usa para publicarlas —
// Greenhouse y Lever son los dos sistemas de reclutamiento más comunes que
// exponen esa lista sin necesitar ninguna llave de API (son endpoints
// públicos, pensados para que sitios como LinkedIn o Indeed los indexen).
//
// A diferencia de Apollo.io (que solo dice "el perfil de esta empresa
// coincide con esta tecnología"), esto es una confirmación real: si aparece
// algo aquí, es porque la empresa lo publicó ella misma, hoy.
//
// Limitación honesta: solo funciona para empresas que usan Greenhouse o
// Lever. Muchas empresas usan otros sistemas (Workday, SmartRecruiters,
// su propia página) que no tienen un endpoint público equivalente — para
// esas, sigue siendo necesario verificar a mano con "Confirmar vacante".

import type { Technology } from "@/lib/types";

export type JobBoardProvider = "greenhouse" | "lever";

export interface JobBoardPosting {
  title: string;
  url: string;
  location?: string | null;
}

export interface JobBoardCheckResult {
  provider: JobBoardProvider | null;
  positions: JobBoardPosting[];
  matches: JobBoardPosting[];
  error?: string;
}

// Palabras clave que sí suelen aparecer en el TÍTULO de una vacante
// publicada (distinto de TECH_KEYWORDS en apollo.ts, que busca coincidencia
// de perfil de empresa, no título de puesto). Exportado porque adzuna.ts
// también lo usa — ahí también estamos buscando vacantes reales por título,
// no perfiles de empresa.
export const TITLE_KEYWORDS: Record<string, string[]> = {
  SAP: ["sap", "s/4hana"],
  Oracle: ["oracle"],
  Salesforce: ["salesforce"],
  "Cloud/DevOps": ["devops", "cloud", "sre", "site reliability", "platform engineer", "aws", "azure", "gcp"],
  "Datos/IA": ["data engineer", "data scientist", "machine learning", "analytics", "inteligencia artificial", "ai engineer"],
  Desarrollo: ["developer", "software engineer", "full stack", "backend", "frontend", "desarrollador", "programador"],
  QA: ["qa", "quality assurance", "sdet", "test engineer", "tester"],
  Ciberseguridad: ["security", "seguridad", "cybersecurity", "infosec"],
  "PM/Consultoría": ["project manager", "consultant", "consultor", "program manager", "scrum master"],
};

// Clasifica el título (y opcionalmente la descripción) de una vacante en una
// de las 9 tecnologías fijas del esquema (signals.technology es NOT NULL con
// un CHECK — no existe "sin especificar"). Se usa para las búsquedas que NO
// parten de una tecnología elegida a mano (por ejemplo, "Buscar posible
// nearshore" en Adzuna/RemoteOK/Remotive): cada resultado se intenta ubicar
// en una de estas categorías por su propio título, y si no calza en ninguna,
// se descarta en vez de inventar una tecnología — nunca se fuerza un dato
// que no está.
export function classifyTechnology(title: string, description?: string | null): Technology | null {
  const haystack = `${title} ${description ?? ""}`.toLowerCase();
  for (const tech of Object.keys(TITLE_KEYWORDS) as Technology[]) {
    if (TITLE_KEYWORDS[tech].some((k) => haystack.includes(k))) {
      return tech;
    }
  }
  return null;
}

export function detectProvider(url: string): JobBoardProvider | null {
  try {
    const host = new URL(url).hostname;
    if (host.includes("greenhouse.io")) return "greenhouse";
    if (host.includes("lever.co")) return "lever";
    return null;
  } catch {
    return null;
  }
}

function extractSlug(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchGreenhouse(slug: string): Promise<JobBoardPosting[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Greenhouse respondió ${res.status} — revisa que el link de la bolsa sea correcto.`);
  }
  const data = (await res.json()) as { jobs?: Array<Record<string, unknown>> };
  return (data.jobs ?? []).map((job) => ({
    title: String(job.title ?? "Vacante sin título"),
    url: String(job.absolute_url ?? ""),
    location: (job.location as { name?: string } | undefined)?.name ?? null,
  }));
}

async function fetchLever(slug: string): Promise<JobBoardPosting[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Lever respondió ${res.status} — revisa que el link de la bolsa sea correcto.`);
  }
  const data = (await res.json()) as Array<Record<string, unknown>>;
  return data.map((posting) => ({
    title: String(posting.text ?? "Vacante sin título"),
    url: String(posting.hostedUrl ?? ""),
    location: (posting.categories as { location?: string } | undefined)?.location ?? null,
  }));
}

export async function checkJobBoard(
  careersUrl: string,
  technology: string
): Promise<JobBoardCheckResult> {
  const provider = detectProvider(careersUrl);
  if (!provider) {
    return {
      provider: null,
      positions: [],
      matches: [],
      error:
        "Ese link no parece ser de Greenhouse ni Lever, que son los dos sistemas que podemos consultar automáticamente por ahora. Verifica la vacante a mano y usa \"Confirmar vacante\".",
    };
  }

  const slug = extractSlug(careersUrl);
  if (!slug) {
    return {
      provider,
      positions: [],
      matches: [],
      error: "No se pudo identificar el nombre de la empresa en ese link.",
    };
  }

  try {
    const positions = provider === "greenhouse" ? await fetchGreenhouse(slug) : await fetchLever(slug);
    const keywords = TITLE_KEYWORDS[technology] ?? [];
    const matches = positions.filter((p) =>
      keywords.some((k) => p.title.toLowerCase().includes(k))
    );
    return { provider, positions, matches };
  } catch (err) {
    return {
      provider,
      positions: [],
      matches: [],
      error: err instanceof Error ? err.message : "Error desconocido consultando la bolsa de empleo.",
    };
  }
}
