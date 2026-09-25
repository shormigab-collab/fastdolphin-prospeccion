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

// Cuando no hay favicon (la mayoría de las veces, ya que muchas empresas de
// ejemplo/prospección no tienen dominio cargado todavía), en vez de un
// mismo cuadro celeste para todas, cada empresa recibe un color fijo entre
// varios — determinado por su propio nombre (mismo nombre → mismo color
// siempre), para que la lista se vea tan viva como cuando sí hay logos
// reales, sin inventar ningún logo que no exista.
const PALETTE = [
  "bg-dolphin-600 text-white",
  "bg-amber-500 text-white",
  "bg-ink text-white",
  "bg-rose-500 text-white",
  "bg-emerald-600 text-white",
  "bg-sky-600 text-white",
  "bg-violet-600 text-white",
  "bg-orange-500 text-white",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
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
          "flex shrink-0 items-center justify-center rounded-xl text-xs font-bold " +
          colorFor(name) +
          " " +
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
