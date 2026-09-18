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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
