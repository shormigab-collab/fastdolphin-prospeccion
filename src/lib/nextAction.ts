import type { CompanyGroup } from "@/lib/groupSignals";

// Qué le conviene hacer a alguien del equipo con esta oportunidad a
// continuación. Dos tipos de resultado, y la diferencia importa:
//
// 1. "follow_up" es real: alguien programó una fecha a propósito (con el
//    botón "Programar seguimiento"), guardada en next_follow_up_at. Puede
//    estar vencida, ser hoy, o ser futura.
// 2. Todo lo demás (assign / find_contact / review) es una SUGERENCIA que
//    la plataforma infiere de datos reales (sin responsable, sin contacto,
//    sin revisar) — nunca una fecha inventada. La interfaz debe marcarlas
//    como sugeridas, no como si alguien las hubiera programado.
export type NextActionKind = "follow_up" | "assign" | "find_contact" | "review" | "none";

export interface NextActionInfo {
  kind: NextActionKind;
  date: string | null;
  note: string | null;
  isOverdue: boolean;
  isToday: boolean;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function nextActionForGroup(group: CompanyGroup): NextActionInfo {
  const primary = group.signals[0];

  // La fecha programada más próxima entre todas las señales del grupo.
  const scheduled = group.signals
    .filter((s) => !!s.next_follow_up_at)
    .sort((a, b) => (a.next_follow_up_at! < b.next_follow_up_at! ? -1 : 1))[0];

  if (scheduled?.next_follow_up_at) {
    const today = todayISO();
    return {
      kind: "follow_up",
      date: scheduled.next_follow_up_at,
      note: scheduled.next_follow_up_note,
      isOverdue: scheduled.next_follow_up_at < today,
      isToday: scheduled.next_follow_up_at === today,
    };
  }

  if (group.signals.every((s) => !s.assigned_user)) {
    return { kind: "assign", date: null, note: null, isOverdue: false, isToday: false };
  }

  if (group.signals.every((s) => !s.contact_name)) {
    return { kind: "find_contact", date: null, note: null, isOverdue: false, isToday: false };
  }

  if (primary.status === "nuevo") {
    return { kind: "review", date: null, note: null, isOverdue: false, isToday: false };
  }

  return { kind: "none", date: null, note: null, isOverdue: false, isToday: false };
}

// true si el grupo tiene algo que de verdad requiere atención hoy: un
// seguimiento vencido, o programado para hoy. Se usa en "Pendientes de
// hoy" — nunca incluye las sugerencias (assign/find_contact/review), esas
// se muestran aparte y claramente marcadas como sugeridas.
export function isPendingToday(info: NextActionInfo) {
  return info.kind === "follow_up" && (info.isOverdue || info.isToday);
}
