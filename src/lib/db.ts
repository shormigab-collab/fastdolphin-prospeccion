import { neon } from "@neondatabase/serverless";

// Cliente de Neon (Postgres serverless, vía HTTP — funciona igual de bien en
// una función normal de Vercel que en el edge, sin problemas de pool de
// conexiones). Se usa como plantilla con tag: sql`select * from x where id = ${id}`
// — los valores interpolados quedan parametrizados automáticamente, así que
// es seguro contra inyección SQL igual que una consulta preparada.
//
// Si conectaste Neon desde la integración de Vercel (Storage > Create
// Database > Neon) en vez de crear el proyecto manualmente en neon.tech,
// Vercel agrega varias variables de entorno con nombres distintos según la
// versión de la integración (DATABASE_URL, POSTGRES_URL, etc.). Probamos
// las más comunes en orden para no depender de una sola.
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    "No se encontró la cadena de conexión a la base de datos. Revisa en Vercel (Settings > Environment Variables) o en tu .env.local cómo se llama la variable que agregó la integración de Neon (DATABASE_URL, POSTGRES_URL, etc.) y ajústala aquí si tiene otro nombre."
  );
}

export const sql = neon(connectionString);
