// ---------------------------------------------------------------------------
// Integración con Apollo.io. Busca empresas cuyo perfil (industria,
// tecnologías, palabras clave) coincide con cada área de servicio de Fast
// Dolphin, y las devuelve como candidatas a señal de prospección.
//
// Importante: la mayoría de planes de Apollo.io NO incluyen un endpoint de
// "vacantes publicadas en tiempo real" (eso suele requerir su feature de
// "Job Postings" / datos de intención, disponible en planes más altos).
// Por eso esto usa el endpoint de búsqueda de empresas (organization search),
// disponible en prácticamente todos los planes con acceso a la API, y arma
// señales de tipo "tecnología detectada" — un punto de partida para que el
// equipo investigue y luego complemente con carga manual desde LinkedIn si
// confirman que están contratando.
//
// Documentación: https://docs.apollo.io/reference/organization-search
// ---------------------------------------------------------------------------

import type { Technology } from "@/lib/types";

export interface ApolloSignalCandidate {
  companyName: string;
  companyDomain?: string | null;
  industry?: string | null;
  technology: Technology;
  title: string;
  sourceUrl?: string | null;
}

export interface ApolloSyncResult {
  candidates: ApolloSignalCandidate[];
  error?: string;
}

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

export function isApolloConnected() {
  return !!APOLLO_API_KEY;
}

// Palabras clave usadas para buscar empresas por cada tecnología que ofrece
// Fast Dolphin. Se pueden ajustar sin tocar el resto del código.
const TECH_KEYWORDS: Record<Technology, string[]> = {
  SAP: ["sap", "s/4hana", "sap consultant"],
  Oracle: ["oracle", "oracle erp", "oracle dba"],
  Salesforce: ["salesforce", "salesforce developer"],
  "Cloud/DevOps": ["devops", "aws", "cloud infrastructure"],
  "Datos/IA": ["data engineering", "machine learning", "data science"],
  Desarrollo: ["software development", "full stack"],
  QA: ["qa automation", "software testing"],
  Ciberseguridad: ["cybersecurity", "information security"],
  "PM/Consultoría": ["it consulting", "project management"],
};

export const ALL_TECHNOLOGIES: Technology[] = Object.keys(TECH_KEYWORDS) as Technology[];

export async function fetchApolloSignals(
  technology: Technology,
  perPage = 5
): Promise<ApolloSyncResult> {
  if (!APOLLO_API_KEY) {
    return { candidates: [], error: "No hay APOLLO_API_KEY configurada." };
  }

  const keywords = TECH_KEYWORDS[technology];

  try {
    const res = await fetch("https://api.apollo.io/v1/mixed_companies/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        q_organization_keyword_tags: keywords,
        page: 1,
        per_page: perPage,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // Devolvemos el mensaje real que da Apollo (por ejemplo, si el plan no
      // incluye este endpoint, o la key es inválida) para poder diagnosticar
      // sin adivinar.
      const message =
        (data && (data.error || data.message)) ||
        `Apollo respondió ${res.status} ${res.statusText}`;
      return { candidates: [], error: String(message) };
    }

    const orgs: Array<Record<string, unknown>> =
      (data?.organizations as Array<Record<string, unknown>>) ??
      (data?.accounts as Array<Record<string, unknown>>) ??
      [];

    const candidates: ApolloSignalCandidate[] = orgs.map((org) => {
      const name = (org.name as string) ?? "Empresa sin nombre";
      return {
        companyName: name,
        companyDomain: (org.primary_domain as string) ?? (org.website_url as string) ?? null,
        industry: (org.industry as string) ?? null,
        technology,
        title: `${name} coincide con el perfil de búsqueda de talento en ${technology} (Apollo.io)`,
        sourceUrl: (org.linkedin_url as string) ?? (org.website_url as string) ?? null,
      };
    });

    return { candidates };
  } catch (err) {
    return {
      candidates: [],
      error: err instanceof Error ? err.message : "Error desconocido llamando a Apollo.io",
    };
  }
}
