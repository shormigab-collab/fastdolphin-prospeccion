import type { DefaultSession } from "next-auth";

// Agrega el id del usuario (de nuestra tabla `users` en Neon) a la sesión,
// que por defecto NextAuth no incluye.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
