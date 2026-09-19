"use client";

import { useState } from "react";

// Muestra el logo de la empresa a partir de su dominio, usando el servicio
// de favicons de Google — gratis, sin necesitar cuenta ni llave de API, y
// funciona desde ya. No es tan bonito como un logo "de verdad" (a veces da
// solo el ícono pequeño del sitio), pero es honesto: si no encuentra nada,
// cae en un avatar con las iniciales de la empresa, nunca un ícono roto.
//
// Mejora posible más adelante: si algún día se configura una cuenta de
// logo.dev (logo.dev/pricing, capa gratis hasta 500k usos/mes, pero pide
// registrarse), se puede intercambiar la URL de abajo por la de logo.dev
// para mejor calidad, sin tocar nada más de este componente.

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function CompanyLogo({
  name,
  domain,
  size = 40,
  className,
}: {
  name: string;
  domain?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : null;

  if (!src || failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className={
          "flex shrink-0 items-center justify-center rounded-xl bg-dolphin-50 text-xs font-semibold text-dolphin-700 " +
          (className ?? "")
        }
      >
        {initialsOf(name) || "?"}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={`Logo de ${name}`}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={
        "shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1.5 " +
        (className ?? "")
      }
    />
  );
}
