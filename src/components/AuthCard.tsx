import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <Logo className="h-6 w-auto" />
        <h1 className="mt-5 text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
