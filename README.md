# Fast Dolphin · Plataforma de Prospección

Plataforma web interna para el equipo comercial de [Fast Dolphin](https://www.fastdolphin.com):
reúne señales de contratación (Apollo.io + hallazgos manuales de LinkedIn),
las prioriza por tecnología, y sugiere el primer mensaje de outreach — que
siempre debe ser revisado y aprobado por una persona antes de enviarse.

Solo personas con correo `@fastdolphin.com` pueden crear una cuenta (se
valida tanto en el formulario como en el servidor, así que no se puede
saltar).

Este es un **demo funcional con datos de ejemplo**: el código y la base de
datos están completos y funcionando de verdad (login, dashboard, flujo de
aprobación, etc.), pero las señales que vienen precargadas son de empresas
ficticias, para que puedas mostrárselo a tus jefes sin depender todavía de
una integración real. La sección [Pasar de demo a datos reales](#pasar-de-demo-a-datos-reales)
explica cómo activar Apollo.io cuando estén listos.

## Stack (100% con capa gratis, sin Supabase)

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Neon** — base de datos Postgres serverless (capa gratis, sin tarjeta)
- **Auth.js / NextAuth** con login por correo y contraseña (propio, no
  depende de un servicio de terceros de pago)
- Pensado para desplegarse en **Vercel** (plan gratis)

> Nota: la versión anterior de este proyecto usaba Supabase. Se cambió a
> Neon + NextAuth porque Supabase empezó a pedir plan de pago (normalmente
> pasa cuando ya se tiene otro proyecto usando el único slot gratis de la
> cuenta, o se supera algún límite de uso). Neon permite varios proyectos
> gratis por cuenta, y NextAuth no tiene costo porque corre dentro de tu
> propia app en vez de ser un servicio externo.

## 1. Crear la base de datos en Neon

Hay dos caminos — llegan al mismo lugar, usa el que te resulte más cómodo.

### Opción A: desde la integración de Vercel (recomendado si ya importaste el proyecto ahí)

1. En tu proyecto de Vercel, ve a la pestaña **Storage** → **Create Database**
   (o **Connect Store**) → elige **Neon** del marketplace.
2. Sigue el flujo — Vercel crea el proyecto de Neon por ti y agrega
   automáticamente las variables de entorno a tu proyecto en los tres
   ambientes (Production, Preview, Development). El nombre exacto de la
   variable puede variar según la versión de la integración
   (`DATABASE_URL`, `POSTGRES_URL`, etc.) — `src/lib/db.ts` ya prueba las
   más comunes, así que no necesitas tocar código.
3. Desde esa misma pantalla de Storage hay un botón tipo **"Open in Neon"**
   / **"Manage in Neon"** que te lleva a la consola de Neon. Ahí ve a **SQL
   Editor** y corre, en este orden:
   - `db/0001_init.sql` (tablas y restricción de dominio)
   - `db/0002_seed_demo.sql` (datos de ejemplo — opcional, bórralos cuando
     conectes datos reales)
4. Para correr el proyecto en tu computador con esas mismas variables (sin
   copiarlas a mano), instala el CLI de Vercel y hala las variables:
   ```bash
   npm i -g vercel
   vercel login
   vercel link      # conecta esta carpeta con el proyecto que ya creaste en Vercel
   vercel env pull .env.local
   ```
   Eso te deja `.env.local` con la conexión a Neon ya lista. Solo te
   faltaría agregar `AUTH_SECRET` (ver paso 2) si la integración no lo puso.

### Opción B: crear el proyecto de Neon por tu cuenta

1. Ve a [neon.tech](https://neon.tech) → crea una cuenta (gratis, sin
   tarjeta) → **New Project**. Ponle nombre, por ejemplo
   "fastdolphin-prospeccion".
2. En el dashboard del proyecto, ve a **SQL Editor** y corre, en este orden:
   - `db/0001_init.sql` (tablas y restricción de dominio)
   - `db/0002_seed_demo.sql` (datos de ejemplo — opcional, bórralos cuando
     conectes datos reales)
3. Ve a **Connection Details** (o "Connect"), elige la opción de **pooled
   connection** (termina en `-pooler` en el host) y copia esa cadena de
   conexión → esa es tu `DATABASE_URL` (pégala en Vercel en Settings →
   Environment Variables, o en tu `.env.local` para correr local).

Si en algún momento quieren permitir otro dominio de correo, agrégalo desde
el SQL Editor de Neon:

```sql
insert into allowed_domains (domain) values ('otrodominio.com');
```

## 2. Correr el proyecto en tu computador

```bash
npm install
cp .env.example .env.local
```

Si usaste la **Opción A** (integración de Vercel) y ya corriste
`vercel env pull .env.local`, la conexión a la base de datos ya está ahí —
solo revisa que tenga `AUTH_SECRET` (si no, agrégalo como se explica abajo)
y que `NEXTAUTH_URL=http://localhost:3000` para probar local.

Si usaste la **Opción B**, abre `.env.local` y completa:
- `DATABASE_URL`: la que copiaste de Neon.
- `AUTH_SECRET`: genera uno con `openssl rand -base64 32` (o cualquier
  string random largo) y pégalo ahí. Es la llave que usa NextAuth para
  firmar las sesiones — no la compartas ni la subas a git.
- Deja `NEXTAUTH_URL=http://localhost:3000` para probar local.

```bash
npm run dev
```

Abre `http://localhost:3000`, crea una cuenta con un correo
`@fastdolphin.com` (o el dominio que hayas configurado) y entra al
dashboard. No hay paso de confirmación por correo (para no depender de un
servicio de envío de emails de pago) — la restricción de dominio es lo que
protege quién puede entrar.

## 3. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub/GitLab.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. Si ya conectaste Neon por la integración de Vercel (Opción A), la
   conexión a la base de datos ya está agregada al proyecto. Si usaste la
   Opción B, agrega `DATABASE_URL` manualmente en **Settings → Environment
   Variables**. De cualquier forma, agrega también ahí:
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` → la URL final que te da Vercel (o tu dominio propio),
     por ejemplo `https://prospeccion-fastdolphin.vercel.app`
   - `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS` → `fastdolphin.com`
   - `APOLLO_API_KEY` → déjalo vacío por ahora
4. Deploy (o **Redeploy** si el proyecto ya se había desplegado antes de
   agregar las variables).

## Pasar de demo a datos reales

- **Apollo.io**: agrega `APOLLO_API_KEY` en las variables de entorno.
  `src/lib/apollo.ts` ya tiene la función `fetchApolloSignals()` lista para
  que reemplaces el cuerpo por la llamada real a la API de Apollo (el
  ejemplo de payload está comentado ahí mismo). Una vez tengan la key, en
  Configuración (`/settings`) la app muestra "Conectado" automáticamente.
  Nota: Apollo.io da datos de empresas, contactos y señales de intención de
  compra — **no** monitorea publicaciones de LinkedIn en tiempo real (LinkedIn
  no lo permite por sus términos de uso). Por eso la carga manual desde
  LinkedIn (`/leads/new`) se queda como una fuente permanente, no solo para
  la demo.
- **Datos de ejemplo**: borra las filas que vengan de `db/0002_seed_demo.sql`
  cuando ya no las necesites (o simplemente no corras ese archivo en un
  proyecto de producción nuevo).
- **Confirmación de correo al registrarse**: hoy no existe (ver punto 2). Si
  más adelante la quieren, se puede agregar con un proveedor de correo
  transaccional con capa gratis, como Resend (100 correos/día gratis).
- **Roles**: por ahora todos los usuarios del dominio permitido tienen el
  mismo acceso. Si más adelante quieren separar administradores de
  vendedores, usa la columna `role` de la tabla `users` (ya existe, con
  valores `admin` / `rep`) y ajusta los permisos en el código donde haga
  falta.

## Estructura del proyecto

```
src/app/                  Páginas (App Router)
  page.tsx                 Landing (para mostrar la idea antes de loguearse)
  login/, signup/           Autenticación (restringida por dominio)
  api/auth/[...nextauth]/    Rutas de NextAuth
  api/register/               Ruta de registro (valida dominio, hashea la
                               contraseña con bcrypt, crea el usuario)
  dashboard/                 Resumen con KPIs
  leads/                      Lista y filtros de señales
  leads/new/                  Formulario de carga manual desde LinkedIn
  leads/[id]/                 Detalle: pitch sugerido, mensaje de outreach
                               con aprobación manual, notas de seguimiento
  settings/                  Estado de Apollo.io y equipo con acceso
src/lib/
  suggestions.ts             Mapea cada tecnología a los servicios/argumentos
                               de venta de Fast Dolphin y genera el borrador
                               de mensaje
  apollo.ts                  Integración con Apollo.io (mock hasta que se
                               conecte la API key real)
  db.ts                       Cliente de Neon (Postgres serverless)
  queries.ts                  Todas las consultas SQL de la app
src/auth.ts                 Configuración de NextAuth (login por correo y
                               contraseña contra la tabla `users`)
db/                        Esquema SQL + datos de ejemplo
```

## Por qué nada se envía automáticamente

Cada señal puede tener un borrador de mensaje generado a partir del pitch de
Fast Dolphin para esa tecnología. Ese borrador queda en estado "pendiente de
aprobación": alguien del equipo lo lee, lo edita si quiere, y lo aprueba. La
plataforma no manda mensajes por su cuenta — el envío real (por LinkedIn o
correo) lo hace la persona, y luego marca el mensaje como "enviado" para
llevar el registro.
