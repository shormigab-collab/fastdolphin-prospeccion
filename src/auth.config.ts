import type { NextAuthConfig } from "next-auth";

// Config "ligera": sin providers ni nada que dependa de bcrypt o de la
// conexión a la base de datos. Es la única parte de la configuración de
// auth que se usa en el middleware (Edge runtime) — así evitamos que
// Next.js empaquete bcryptjs (que usa APIs de Node no soportadas en Edge)
// dentro del middleware. src/auth.ts extiende esto y le agrega el
// Credentials provider real, para usarse en rutas API, server components y
// server actions (Node runtime).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
