"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/leads", label: "Señales / Leads" },
  { href: "/leads/new", label: "+ Cargar de LinkedIn" },
  { href: "/settings", label: "Configuración" },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white">
      <div>
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="text-sm font-bold tracking-widest text-dolphin-700">
            FAST DOLPHIN
          </div>
          <div className="text-xs text-slate-400">Prospección</div>
        </div>
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-medium",
                pathname === link.href
                  ? "bg-dolphin-50 text-dolphin-700"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-200 p-4">
        <div className="truncate text-xs text-slate-500">{email}</div>
        <button
          onClick={handleLogout}
          className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
