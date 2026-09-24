// ---------------------------------------------------------------------------
// Detección honesta de "posible nearshore": ninguna de las bolsas de empleo
// que consumimos (Adzuna, RemoteOK, Remotive) clasifica sus vacantes como
// "buscan talento nearshore/LatAm" — no es un campo que exista en sus datos.
// Lo único que se puede hacer sin inventar nada es buscar palabras clave
// típicas de este tipo de búsqueda en el título, la ubicación y la
// descripción de la vacante.
//
// Por eso esto NUNCA se presenta como un dato certero — en la interfaz
// siempre aparece como "Posible nearshore" (nunca solo "Nearshore"), con
// aclaración de que es una coincidencia de texto y puede tener falsos
// positivos o negativos. Ver Signal.mentions_nearshore en @/lib/types.
// ---------------------------------------------------------------------------

const NEARSHORE_HINTS = [
  "nearshore",
  "near-shore",
  "near shore",
  "latam",
  "lat am",
  "latin america",
  "america latina",
  "américa latina",
  "south america",
  "sudamérica",
  "sudamerica",
];

export function mentionsNearshore(...texts: (string | null | undefined)[]): boolean {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  return NEARSHORE_HINTS.some((hint) => haystack.includes(hint));
}
