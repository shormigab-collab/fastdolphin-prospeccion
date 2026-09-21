// Aparte de src/lib/i18n.ts a propósito: este archivo importa next/headers,
// que solo puede usarse en Server Components / Route Handlers. Si viviera
// junto con el diccionario, cualquier componente de cliente que solo
// necesita el diccionario (como Badges.tsx) arrastraría next/headers hasta
// el bundle del navegador, y el build falla. Los componentes de servidor
// importan getLang() de acá; todos los demás importan de "@/lib/i18n".
import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

export function getLang(): Lang {
  try {
    const store = cookies();
    const value = store.get(LANG_COOKIE)?.value;
    return value === "en" ? "en" : "es";
  } catch {
    // cookies() puede fallar fuera de un request real (p. ej. en build) —
    // en ese caso, español por defecto.
    return "es";
  }
}
