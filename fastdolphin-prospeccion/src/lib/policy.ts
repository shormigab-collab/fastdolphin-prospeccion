import type { WorkMode } from "@/lib/types";

// Fast Dolphin solo quiere perseguir señales de vacantes remotas, o
// presenciales/híbridas específicamente en México o Brasil (donde tienen
// talento nearshore físico). Esta función decide si una señal cumple esa
// política, y se usa para filtrar por defecto lo que ve el equipo en /leads.
export function matchesLocationPolicy(workMode: WorkMode, location: string | null) {
  if (workMode === "remoto") return true;
  if (!location) return false;
  return /(m[eé]xico|mexico|brasil|brazil)/i.test(location);
}
