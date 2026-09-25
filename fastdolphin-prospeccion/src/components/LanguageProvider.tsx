"use client";

// Contexto de idioma para los componentes de cliente. El valor inicial
// viene del servidor (leyó la cookie ahí), así que en el primer render no
// hay parpadeo entre idiomas. Cuando alguien cambia de idioma, actualizamos
// el estado local al toque (para que se sienta instantáneo) y en paralelo
// guardamos la cookie en el servidor para que las páginas server-side
// también se vuelvan a renderizar en el idioma nuevo.

import { createContext, useCallback, useContext, useState, useTransition } from "react";
import { dict, type Dict, type Lang } from "@/lib/i18n";
import { setLanguageAction } from "@/app/actions/language";

interface LanguageContextValue {
  lang: Lang;
  t: Dict;
  setLang: (lang: Lang) => void;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [isPending, startTransition] = useTransition();

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    startTransition(() => {
      setLanguageAction(next);
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t: dict[lang], setLang, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage debe usarse dentro de un LanguageProvider.");
  }
  return ctx;
}
