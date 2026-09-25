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
import { TITLE_KEYWORDS } from "@/lib/jobBoards";

export interface ApolloSignalCandidate {
  companyName: string;
  companyDomain?: string | null;
  industry?: string | null;
  technology: Technology;
  title: string;
  sourceUrl?: string | null;
  // true cuando el candidato vino del modo "vacante activa" (filtro
  // q_organization_job_titles) en vez del modo de siempre (perfil de
  // empresa) — ver fetchApolloSignals más abajo. Sirve para que la ruta
  // que crea la señal decida el signal_type/prioridad correctos y no
  // trate ambos modos igual.
  basedOnActiveJobPosting?: boolean;
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
  perPage = 20,
  page = 1,
  activeJobsOnly = false
): Promise<ApolloSyncResult> {
  if (!APOLLO_API_KEY) {
    return { candidates: [], error: "No hay APOLLO_API_KEY configurada." };
  }

  // Modo normal: coincidencia de PERFIL de empresa (industria/palabras
  // clave), sin confirmar que estén contratando ahora mismo — el
  // comportamiento de siempre.
  //
  // Modo "vacante activa" (activeJobsOnly): en vez de perfil, usa
  // q_organization_job_titles — un parámetro real de la búsqueda de
  // organizaciones de Apollo que filtra por los títulos que aparecen en
  // vacantes ACTIVAS publicadas por la empresa ahora mismo (ver
  // https://docs.apollo.io/reference/organization-search). Reutiliza
  // TITLE_KEYWORDS (el mismo diccionario que ya usan Adzuna/RemoteOK/
  // Remotive) en vez de TECH_KEYWORDS, porque acá lo que importa es cómo
  // se llama el PUESTO en la vacante, no cómo describe Apollo el perfil
  // de la empresa. Documentación de Apollo indica que este filtro está
  // disponible desde el plan Basic — si el plan no lo soporta, Apollo
  // responde con su propio error, que se muestra tal cual (ver más abajo).
  const keywords = activeJobsOnly ? TITLE_KEYWORDS[technology] ?? [technology] : TECH_KEYWORDS[technology];

  try {
    const res = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify(
        activeJobsOnly
          ? { q_organization_job_titles: keywords, page, per_page: perPage }
          : { q_organization_keyword_tags: keywords, page, per_page: perPage }
      ),
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
        title: activeJobsOnly
          ? `${name} tiene una vacante activa en Apollo.io con un título relacionado a ${technology}`
          : `${name} coincide con el perfil de búsqueda de talento en ${technology} (Apollo.io)`,
        sourceUrl: (org.linkedin_url as string) ?? (org.website_url as string) ?? null,
        basedOnActiveJobPosting: activeJobsOnly,
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

// ---------------------------------------------------------------------------
// Búsqueda de contacto (RRHH / Talent Acquisition) por empresa, bajo demanda
// desde el detalle de una señal — botón "Buscar contacto".
//
// Dos llamadas a Apollo:
//   1. People Search: busca personas de esa empresa con cargos de RRHH /
//      contratación (sin gastar crédito, solo trae nombre/cargo/LinkedIn).
//   2. People Match (enrichment): revela el correo de esa persona (esto sí
//      consume 1 crédito del plan). El teléfono casi nunca viene en la
//      respuesta síncrona — Apollo lo entrega vía un webhook asíncrono en
//      planes que lo soportan — así que si no viene, lo mostramos como "no
//      disponible" en vez de tratarlo como error.
//
// Documentación: https://docs.apollo.io/reference/people-api-search
//                https://docs.apollo.io/reference/people-enrichment
//
// Nota: Apollo movió toda su API a rutas /api/v1/... (antes eran /v1/...) y
// además renombró el endpoint de personas de mixed_people/search a
// mixed_people/api_search — el código de acá ya usa las rutas nuevas.
// ---------------------------------------------------------------------------

const CONTACT_TITLES = [
  "talent acquisition",
  "recruiter",
  "recruiting",
  "human resources",
  "hr manager",
  "hr business partner",
  "people operations",
];

export interface ApolloContact {
  apolloId: string | null;
  name: string;
  title: string | null;
  email: string | null;
  emailStatus: string | null;
  phone: string | null;
  linkedinUrl: string | null;
}

export interface ApolloContactResult {
  contact?: ApolloContact | null;
  error?: string;
}

// El endpoint de personas filtra por dominio, no por nombre de empresa. Si
// la señal no tiene un dominio guardado (pasa seguido con carga manual de
// LinkedIn), primero se busca la empresa por nombre en organization search
// para conseguir su dominio, y con eso sí se puede buscar a la persona.
async function resolveCompanyDomain(companyName: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY as string,
      },
      body: JSON.stringify({
        q_organization_name: companyName,
        page: 1,
        per_page: 1,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const org = (data?.organizations as Array<Record<string, unknown>>)?.[0];
    return (org?.primary_domain as string) ?? (org?.website_url as string) ?? null;
  } catch {
    return null;
  }
}

export async function findCompanyContact(params: {
  companyName: string;
  companyDomain?: string | null;
}): Promise<ApolloContactResult> {
  if (!APOLLO_API_KEY) {
    return { error: "No hay APOLLO_API_KEY configurada." };
  }

  try {
    const domain = params.companyDomain || (await resolveCompanyDomain(params.companyName));

    if (!domain) {
      return {
        error:
          "No se pudo determinar el dominio de la empresa en Apollo.io (ni el guardado ni buscando por nombre), y este endpoint solo filtra por dominio.",
      };
    }

    const searchRes = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        q_organization_domains_list: [domain],
        person_titles: CONTACT_TITLES,
        page: 1,
        per_page: 1,
      }),
    });

    const searchData = await searchRes.json().catch(() => null);

    if (!searchRes.ok) {
      const message =
        (searchData && (searchData.error || searchData.message)) ||
        `Apollo respondió ${searchRes.status} ${searchRes.statusText}`;
      return { error: String(message) };
    }

    const people: Array<Record<string, unknown>> =
      (searchData?.people as Array<Record<string, unknown>>) ?? [];
    const person = people[0];

    if (!person) {
      return { contact: null };
    }

    const matchRes = await fetch("https://api.apollo.io/api/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        id: person.id,
        reveal_personal_emails: false,
      }),
    });

    const matchData = await matchRes.json().catch(() => null);

    const baseContact: ApolloContact = {
      apolloId: (person.id as string) ?? null,
      name: (person.name as string) ?? "Contacto sin nombre",
      title: (person.title as string) ?? null,
      email: null,
      emailStatus: null,
      phone: null,
      linkedinUrl: (person.linkedin_url as string) ?? null,
    };

    if (!matchRes.ok) {
      const message =
        (matchData && (matchData.error || matchData.message)) ||
        `Apollo respondió ${matchRes.status} ${matchRes.statusText}`;
      // Encontramos a la persona pero no se pudo revelar el correo — se
      // devuelve lo que sí se encontró, junto con el error real de Apollo.
      return { contact: baseContact, error: `No se pudo revelar el correo: ${message}` };
    }

    const matched = (matchData?.person as Record<string, unknown>) ?? {};

    return {
      contact: {
        apolloId: (matched.id as string) ?? baseContact.apolloId,
        name: (matched.name as string) ?? baseContact.name,
        title: (matched.title as string) ?? baseContact.title,
        email: (matched.email as string) ?? null,
        emailStatus: (matched.email_status as string) ?? null,
        phone:
          (matched.phone_number as string) ??
          (matched.sanitized_phone as string) ??
          (matched.mobile_phone as string) ??
          null,
        linkedinUrl: (matched.linkedin_url as string) ?? baseContact.linkedinUrl,
      },
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error desconocido llamando a Apollo.io",
    };
  }
}
