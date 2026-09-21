"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/AuthCard";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useLanguage } from "@/components/LanguageProvider";

const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";
const ALLOWED_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "fastdolphin.com"
)
  .split(",")
  .map((d) => d.trim().toLowerCase());

function isAllowedEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Chequeo en el cliente para dar feedback inmediato. La validación real
    // (la que no se puede saltar) vive en /api/register, que rechaza el
    // registro si el dominio no está en la tabla allowed_domains.
    if (!isAllowedEmail(email)) {
      setError(`${t.auth.domainOnlyPrefix}${ALLOWED_DOMAINS.join(", ")}.`);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      setError(body.error ?? t.auth.couldNotCreate);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (!result || result.error) {
      setError(t.auth.createdButLoginFailed);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title={t.auth.signupTitle}
      subtitle={`${t.auth.signupSubtitlePrefix}${ALLOWED_DOMAINS.join(", ")}.`}
    >
      {GOOGLE_LOGIN_ENABLED && (
        <>
          <GoogleSignInButton label={t.auth.googleCreate} />
          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            {t.auth.orEmail}
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">{t.auth.fullName}</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-dolphin-500 focus:outline-none focus:ring-1 focus:ring-dolphin-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{t.auth.fdEmail}</label>
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
          <label className="text-sm font-medium text-slate-700">{t.auth.password}</label>
          <input
            type="password"
            required
            minLength={8}
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
          {loading ? t.auth.creatingAccount : t.auth.createAccount}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {t.auth.alreadyHaveAccount}{" "}
        <Link href="/login" className="font-medium text-dolphin-600">
          {t.auth.loginHere}
        </Link>
      </p>
    </AuthCard>
  );
}
