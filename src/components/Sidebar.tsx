"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { Logo } from "@/components/Logo";
import { IconHome, IconList, IconUpload, IconSettings, IconMenu, IconX } from "@/components/icons";
import { useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Sidebar({ email, fullName }: { email: string; fullName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  // En pantallas chicas el menú es un panel deslizante (drawer) en vez de
  // una barra lateral fija — se cierra solo al navegar a otra pantalla, así
  // no se queda tapando el contenido después de un clic.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: "/dashboard", label: t.nav.resumen, icon: IconHome },
    { href: "/leads", label: t.nav.señales, icon: IconList },
    { href: "/leads/new", label: t.nav.cargar, icon: IconUpload },
    { href: "/settings", label: t.nav.config, icon: IconSettings },
  ];

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  const initials = (fullName ?? email)
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <>
      {/* Barra superior solo en móvil/tablet — el botón de menú abre el
          drawer con la navegación completa. */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.nav.openMenu}
          className="rounded-lg p-1.5 text-ink hover:bg-slate-50"
        >
          <IconMenu className="h-6 w-6" />
        </button>
        <Logo className="h-6 w-auto" />
        <LanguageSwitcher />
      </div>

      {/* Fondo oscuro detrás del drawer — clic para cerrar */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] shrink-0 flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-200 ease-out",
          "lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center justify-between gap-2">
              <Logo className="h-6 w-auto" />
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.nav.closeMenu}
                  className="rounded-lg p-1.5 text-ink hover:bg-slate-50 lg:hidden"
                >
                  <IconX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-1 text-xs font-medium text-slate-400">{t.nav.tagline}</div>
          </div>
          <div className="px-5 pt-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {t.nav.tagline}
          </div>
          <nav className="mt-2 flex flex-col gap-1 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:py-2",
                    active
                      ? "bg-dolphin-50 text-dolphin-700"
                      : "text-ink/70 hover:bg-slate-50 hover:text-ink"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dolphin-100 text-xs font-semibold text-dolphin-700">
              {initials || "FD"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">{fullName ?? email}</div>
              <div className="truncate text-xs text-slate-400">{email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 text-xs font-medium text-slate-500 hover:text-ink"
          >
            {t.nav.logout}
          </button>
        </div>
      </aside>
    </>
  );
}
