import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { authConfig } from "@/auth.config";

// Si no hay credenciales de Google configuradas en Vercel (GOOGLE_CLIENT_ID /
// GOOGLE_CLIENT_SECRET), simplemente no se agrega el provider — el login por
// correo/contraseña sigue funcionando igual, y el botón de Google se puede
// ocultar en el front revisando esta misma variable de entorno.
const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

async function isAllowedDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  const rows = (await sql`
    select 1 from allowed_domains where domain = ${domain} limit 1
  `) as unknown as unknown[];
  return rows.length > 0;
}

// Busca (o crea, la primera vez que alguien entra con Google) la fila de
// `users` correspondiente a ese correo, y devuelve su id — el mismo id que
// usa el resto de la app (notas, borradores aprobados, etc.) para saber
// quién hizo qué.
async function findOrCreateUserByEmail(email: string, fullName: string | null) {
  const existing = (await sql`
    select id from users where email = ${email} limit 1
  `) as unknown as { id: string }[];

  if (existing[0]) return existing[0].id;

  const created = (await sql`
    insert into users (email, password_hash, full_name, role)
    values (${email}, null, ${fullName}, 'rep')
    returning id
  `) as unknown as { id: string }[];

  return created[0].id;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const rows = (await sql`
          select id, email, password_hash, full_name
          from users
          where email = ${email}
          limit 1
        `) as unknown as {
          id: string;
          email: string;
          password_hash: string | null;
          full_name: string | null;
        }[];

        const user = rows[0];
        // Una cuenta creada por Google no tiene password_hash — no se puede
        // iniciar sesión ahí con contraseña.
        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.full_name ?? user.email };
      },
    }),
    ...googleProvider,
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email?.toLowerCase();
        if (!email) return false;
        // Mismo control de dominio que el registro por correo/contraseña —
        // solo se puede entrar con un correo de los dominios permitidos
        // (por defecto, fastdolphin.com), venga por Google o no.
        const allowed = await isAllowedDomain(email);
        if (!allowed) return false;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const email = String(profile.email).toLowerCase();
        token.id = await findOrCreateUserByEmail(email, (profile.name as string) ?? email);
        return token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
