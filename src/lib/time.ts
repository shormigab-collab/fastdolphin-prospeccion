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
