"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/AuthCard";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";
const ALLOWED_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "fastdolphin.com"
)
  .split(",")
  .map((d) => d.trim());

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "AccessDenied"
      ? `Solo se puede entrar con un correo de ${ALLOWED_DOMAINS.join(", ")}.`
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="Inicia sesión"
      subtitle="Usa tu cuenta del equipo de Fast Dolphin."
    >
      {GOOGLE_LOGIN_ENABLED && (
        <>
          <GoogleSignInButton />
          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            o con tu correo
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu.nombre@fastdolphin.com"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-dolphin-600 px-4 py-2 text-sm font-semibold text-white hover:bg-dolphin-700 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-medium text-dolphin-600">
          Créala aquí
        </Link>
      </p>
    </AuthCard>
  );
}
