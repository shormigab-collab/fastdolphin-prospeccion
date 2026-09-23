import type { Signal, Company } from "@/lib/types";

// La lista de /leads pasó de mostrar una fila por señal a una fila por
// empresa (como en el diseño de Oportunidades), porque una misma empresa
// casi siempre tiene varias señales sueltas (distintas tecnologías, o la
// misma vacante detectada por dos fuentes) y verlas juntas es más útil
// para decidir el próximo paso. El detalle de cada señal (contacto,
// notas, borradores) sigue viviendo en /leads/[id] sin cambios — acá solo
// se agrupa para la vista de lista.
export interface CompanyGroup {
  company: Company;
  // Ya vienen ordenadas por prioridad/fecha (mismo orden que listSignals).
  // signals[0] es la señal "principal" del grupo — la que decide qué
  // estado y próxima acción mostrar a nivel de fila.
  signals: Signal[];
}

export function groupSignalsByCompany(signals: Signal[]): CompanyGroup[] {
  const order: string[] = [];
  const byCompany = new Map<string, CompanyGroup>();

  for (const s of signals) {
    if (!s.company) continue;
    const existing = byCompany.get(s.company_id);
    if (existing) {
      existing.signals.push(s);
    } else {
      byCompany.set(s.company_id, { company: s.company, signals: [s] });
      order.push(s.company_id);
    }
  }

  return order.map((id) => byCompany.get(id)!);
}

// Tecnologías distintas dentro de un grupo, en el orden en que aparecen.
export function distinctTechnologies(group: CompanyGroup) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of group.signals) {
    if (!seen.has(s.technology)) {
      seen.add(s.technology);
      out.push(s.technology);
    }
  }
  return out;
}
