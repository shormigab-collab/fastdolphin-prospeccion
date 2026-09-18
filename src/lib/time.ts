// "hace 2 horas", "hace 5 minutos", etc. — para la actividad reciente del
// dashboard. Nada elegante, solo evita traer una librería para esto.
export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return "hace un momento";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin === 1 ? "" : "s"}`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr} hora${diffHr === 1 ? "" : "s"}`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `hace ${diffDay} día${diffDay === 1 ? "" : "s"}`;

  const diffMonth = Math.floor(diffDay / 30);
  return `hace ${diffMonth} mes${diffMonth === 1 ? "" : "es"}`;
}
