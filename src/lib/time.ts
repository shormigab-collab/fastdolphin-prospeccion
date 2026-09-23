import { dict, type Lang } from "@/lib/i18n";

// "hace 2 horas" / "2 hours ago", etc. — para la actividad reciente del
// dashboard. Nada elegante, solo evita traer una librería para esto.
export function timeAgo(iso: string, lang: Lang = "es") {
  const t = dict[lang].time;
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return t.justNow;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t.minutesAgo(diffMin);

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t.hoursAgo(diffHr);

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return t.daysAgo(diffDay);

  const diffMonth = Math.floor(diffDay / 30);
  return t.monthsAgo(diffMonth);
}

// Normaliza una columna `date` de Postgres a "YYYY-MM-DD", sin importar si
// el driver la entregó como string (lo normal con @neondatabase/serverless)
// o como objeto Date (algunos entornos/versiones lo hacen) — para que el
// resto del código pueda comparar y formatear fechas de seguimiento sin
// preocuparse por cuál de los dos llegó. Devuelve null si no hay fecha.
export function toDateOnlyString(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Por si algún día llega con hora incluida ("2026-09-25T00:00:00.000Z").
  return value.slice(0, 10);
}

// Fecha corta ("12 mar 2025" / "Mar 12, 2025") para mostrar seguimientos
// programados — recibe una fecha "YYYY-MM-DD" (columna `date` de Postgres,
// sin hora) o un objeto Date, y la formatea en el idioma activo, sin
// desfasarse por huso horario (por eso se arma la Date en UTC explícitamente).
export function formatDate(isoDate: string | Date, lang: Lang = "es") {
  const normalized = toDateOnlyString(isoDate) ?? "";
  const [year, month, day] = normalized.split("-").map(Number);
  const d = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  return d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
