import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Evita que Next.js intente pre-generar páginas en tiempo de build (incluida
// la de "no encontrado"). El SessionProvider de NextAuth necesita saber la
// URL real de la app, y durante el build todavía no hay ninguna petición de
// la que sacarla — eso es lo que causaba los errores "Invalid URL". Al
// forzar renderizado dinámico, cada página se genera cuando alguien la
// visita (con la URL real ya disponible), no durante el build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prospección · Fast Dolphin",
  description:
    "Herramienta interna de prospección de Fast Dolphin: detecta señales de contratación y ayuda a preparar el outreach.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/*
          Inter cargada como hoja de estilo normal (no con next/font/google)
          a propósito: next/font descarga la fuente en build time, y si esa
          descarga falla por cualquier razón de red, se cae el build entero
          (ya tuvimos suficientes dolores de cabeza con builds rotos). Así,
          la fuente se pide desde el navegador de cada visitante, como
          cualquier página web normal — nunca puede tumbar el deploy.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
