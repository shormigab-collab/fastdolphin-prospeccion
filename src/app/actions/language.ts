"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

// Guarda la preferencia de idioma en una cookie (un año) y fuerza a que
// todas las páginas server-side se vuelvan a renderizar con el nuevo
// idioma. No toca la base de datos — es una preferencia de navegador, no
// de la cuenta, así que funciona igual para cualquiera que use ese
// dispositivo.
export async function setLanguageAction(lang: Lang) {
  const store = cookies();
  store.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
