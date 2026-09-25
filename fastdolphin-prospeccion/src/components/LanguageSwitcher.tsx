"use client";

import clsx from "clsx";
import { useLanguage } from "@/components/LanguageProvider";

// Selector compacto ES/EN, reutilizado en el sidebar (adentro de la app) y
// en las pantallas públicas (inicio, login, registro) — así se puede
// cambiar de idioma antes incluso de haber iniciado sesión.
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, isPending } = useLanguage();

  return (
    <div
      className={clsx(
        "flex shrink-0 overflow-hidden rounded-lg border border-slate-200 text-[11px] font-semibold",
        className
      )}
    >
      <button
        type="button"
        disabled={isPending}
        onClick={() => setLang("es")}
        aria-pressed={lang === "es"}
        title="Español"
        className={clsx(
          "px-1.5 py-1 transition-colors disabled:opacity-60",
          lang === "es" ? "bg-dolphin-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
        )}
      >
        ES
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        title="English"
        className={clsx(
          "px-1.5 py-1 transition-colors disabled:opacity-60",
          lang === "en" ? "bg-dolphin-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
        )}
      >
        EN
      </button>
    </div>
  );
}
