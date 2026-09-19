"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { Logo } from "@/components/Logo";
import { IconHome, IconList, IconUpload, IconSettings } from "@/components/icons";

const links = [
  { href: "/dashboard", label: "Resumen", icon: IconHome },
  { href: "/leads", label: "Señales / Leads", icon: IconList },
  { href: "/leads/new", label: "Cargar vacante manual", icon: IconUpload },
  { href: "/settings", label: "Configuración", icon: IconSettings },
];

export function Sidebar({ email, fullName }: { email: string; fullName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

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
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white">
      <div>
        <div className="border-b border-slate-200 px-5 py-5">
          <Logo className="h-6 w-auto" />
          <div className="mt-1 text-xs font-medium text-slate-400">Prospección</div>
        </div>
        <div className="px-5 pt-5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Prospección
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
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
