// ---------------------------------------------------------------------------
// Integración con Apollo.io — HOY este archivo solo genera datos de ejemplo
// (para que la demo funcione sin necesidad de una API key). Cuando tengan
// lista la key de Apollo.io, reemplacen el cuerpo de fetchApolloSignals()
// por la llamada real y dejen todo lo demás (tipos, mapeo a `signals`) igual.
//
// Documentación de la API de búsqueda de personas/empresas de Apollo:
// https://docs.apollo.io/reference/people-search
//
// Nota importante: Apollo.io da datos de empresas, contactos y (en planes
// superiores) señales de intención de compra — NO monitorea publicaciones de
// LinkedIn en tiempo real. Por eso esta herramienta combina Apollo.io con la
// carga manual (ver /leads/new) para lo que el equipo encuentra directamente
// en LinkedIn.
// ---------------------------------------------------------------------------

import type { Technology } from "@/lib/types";

export interface ApolloSignalCandidate {
  companyName: string;
  companyDomain?: string;
  industry?: string;
  technology: Technology;
  title: string;
  sourceUrl?: string;
}

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

export function isApolloConnected() {
  return !!APOLLO_API_KEY;
}

// Reemplazar esta función cuando se conecte la API real de Apollo.io.
// Debe devolver una lista de candidatos a señal que luego se insertan en la
// tabla `signals` (ver src/app/api/apollo/sync/route.ts para el flujo
// sugerido de sincronización).
export async function fetchApolloSignals(): Promise<ApolloSignalCandidate[]> {
  if (!APOLLO_API_KEY) {
    // Sin API key: no inventamos señales nuevas, la demo ya trae ejemplos
    // sembrados por db/0002_seed_demo.sql.
    return [];
  }

  // Ejemplo de cómo se vería la llamada real (ajustar payload según el plan
  // de Apollo.io contratado):
  //
  // const res = await fetch("https://api.apollo.io/v1/mixed_companies/search", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     api_key: APOLLO_API_KEY,
  //     q_organization_keyword_tags: ["SAP", "hiring"],
  //   }),
  // });
  // const data = await res.json();
  // return data.organizations.map(mapApolloOrgToSignal);

  return [];
}
