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

## Iniciar sesión con Google (opcional)

Además del login por correo y contraseña, la app puede mostrar un botón
"Continuar con Google" que solo deja entrar con una cuenta de Google del
dominio permitido (por defecto, `@fastdolphin.com`). Está apagado por
defecto — mientras no se configure nada de esto, nadie ve el botón y el
login por correo/contraseña sigue funcionando exactamente igual.

Para activarlo:

1. En el **SQL Editor** de Neon, corre `db/0006_google_auth.sql` (quita la
   restricción de que toda cuenta tenga contraseña propia, porque una
   cuenta creada por Google no la tiene).
2. Alguien con acceso al **Google Cloud Console** del Workspace de Fast
   Dolphin (normalmente no es la persona que despliega la app, sino alguien
   de sistemas/administración) debe crear unas credenciales OAuth:
   - En [Google Cloud Console](https://console.cloud.google.com/) → **APIs
     & Services** → **Credentials** → **Create Credentials** → **OAuth
     client ID** → tipo **Web application**.
   - En **Authorized redirect URIs** agrega:
     `https://<tu-dominio-de-vercel>/api/auth/callback/google`
   - Copia el **Client ID** y el **Client Secret** que genera.
3. En Vercel, **Settings → Environment Variables**, agrega:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED` → `true`
4. Redeploy. El botón de Google aparece en `/login` y `/signup`, y solo deja
   entrar (o crear cuenta) con un correo de Google de los dominios
   permitidos — si alguien intenta con otro dominio, la app lo rechaza y le
   muestra el mismo aviso que usa el registro por correo.

Una cuenta creada por Google usa el mismo `id` interno que el resto de la
app (notas, mensajes aprobados, etc.), así que si alguien ya tenía cuenta
por correo/contraseña y luego entra por primera vez con Google usando el
mismo correo, la app la reconoce como la misma persona.

## Vacantes confirmadas y correos de prioridad alta (opcional)

Como el plan de Apollo.io que usamos no confirma vacantes activas en tiempo
real (solo perfiles de empresa que coinciden con una tecnología), se agregó
un botón **"Confirmar vacante"** en el detalle de cada señal: alguien del
equipo lo usa cuando verificó a mano (en LinkedIn, la página de la empresa,
etc.) que la vacante existe de verdad. Al confirmarla, la señal sube a
prioridad alta, queda registrado en las notas (sale en "Actividad
reciente"), y — si el correo está configurado — se le avisa a todo el
equipo por email. Lo mismo pasa si alguien carga manualmente una señal ya
con prioridad alta desde `/leads/new`.

Para activar los correos:

1. En el **SQL Editor** de Neon, corre `db/0007_vacancy_confirmation.sql`.
2. Crea una cuenta gratis en [resend.com](https://resend.com) (100
   correos/día gratis, sin tarjeta) y saca una API key.
3. En Vercel, **Settings → Environment Variables**, agrega `RESEND_API_KEY`
   con esa key. Con eso ya basta — por defecto los correos salen del
   dominio de pruebas de Resend, así que no hace falta nada más.
4. (Opcional) Si además quieren que los correos salgan como
   `@fastdolphin.com` en vez del dominio de pruebas de Resend, hay que
   verificar el dominio en Resend, lo cual pide acceso al DNS de
   fastdolphin.com — normalmente esto lo hace alguien de sistemas, no un
   empleado normal. Una vez verificado, agrega `EMAIL_FROM` con algo como
   `Fast Dolphin Prospección <notificaciones@fastdolphin.com>`.
5. Redeploy. Mientras no exista `RESEND_API_KEY`, la plataforma no manda
   ningún correo — todo lo demás sigue funcionando igual.

Los correos se envían a todas las personas que tengan cuenta creada en la
plataforma (`listUsers()` en `src/lib/queries.ts`).

## Confirmación automática vía bolsa de empleo (Greenhouse / Lever)

Además de confirmar una vacante a mano, la plataforma puede revisar
directamente la bolsa de empleo pública de la empresa (si usa Greenhouse o
Lever, dos sistemas de reclutamiento muy comunes que exponen su lista de
vacantes abiertas sin necesitar ninguna llave de API) y avisar si hay algo
que coincida con la tecnología de la señal — esto sí es una confirmación
real de que la empresa está contratando, no solo un perfil que coincide.

Cómo se usa: en el detalle de cualquier señal, en la tarjeta "Bolsa de
empleo de la empresa", pega el link de su página de vacantes (por ejemplo
`https://jobs.lever.co/empresa` o `https://boards.greenhouse.io/empresa` —
normalmente se encuentra en el botón "Careers" o "Empleos" del sitio de la
empresa) y dale a "Buscar vacantes abiertas". Si encuentra algo que
coincide, puedes confirmar la vacante ahí mismo con un clic, y queda
registrada con el título y el link reales de la publicación que se
encontró.

Requiere correr `db/0008_job_boards.sql` en el SQL Editor de Neon (agrega
el campo para guardar ese link por empresa). No necesita ninguna variable
de entorno ni cuenta nueva — es gratis y funciona apenas corras la
migración.

Limitación honesta: solo funciona para empresas que usan Greenhouse o
Lever. Para las que usan otro sistema (Workday, SmartRecruiters, su propia
página, etc.) no hay un endpoint público equivalente que podamos consultar
automáticamente — para esas, sigue siendo necesario el botón "Confirmar
vacante" a mano.

## Detección automática de vacantes reales por tecnología (Adzuna)

Además de Apollo (que compara el *perfil* de una empresa con una tecnología,
sin saber si de verdad están contratando) y de la confirmación vía
Greenhouse/Lever (que requiere ya tener el link de esa empresa), la
plataforma puede **buscar directamente vacantes reales publicadas hoy** que
mencionen SAP, Oracle, Salesforce, Cloud/DevOps, Datos/IA, Desarrollo, QA,
Ciberseguridad o PM/Consultoría, usando [Adzuna](https://developer.adzuna.com),
un buscador de empleo con capa gratis (solo requiere registrarse, sin
tarjeta, cientos de consultas al día) y cobertura en EE.UU. y Canadá.

Cómo se usa: en Configuración (`/settings`), en la tarjeta "Adzuna", elige
tecnología y país y dale a "Sincronizar ahora". Cada vacante que encuentra
ya trae el link directo a la publicación real, así que las señales que crea
entran **ya confirmadas** (prioridad alta, sin necesitar el botón
"Confirmar vacante" aparte) — a diferencia de las señales de Apollo, que
siguen entrando como corazonada a verificar.

Para activarlo:

1. Crea una cuenta gratis en https://developer.adzuna.com/ y genera tu
   `app_id` y `app_key`.
2. Agrega `ADZUNA_APP_ID` y `ADZUNA_APP_KEY` en las variables de entorno de
   Vercel.
3. Corre `db/0009_adzuna.sql` en el SQL Editor de Neon (agrega `'adzuna'`
   como fuente válida de señal).

Mientras no estén configuradas esas dos variables, la tarjeta de Adzuna en
Configuración simplemente aparece como "Pendiente" y no se puede
sincronizar — el resto de la app sigue funcionando igual.

Limitaciones honestas:

- Adzuna no siempre indica de forma confiable si el puesto es remoto — la
  app usa una heurística (busca "remote"/"remoto" en el título y la
  ubicación) para decidirlo; si no encuentra esa palabra, lo guarda como
  presencial. Combinado con el filtro de modalidad (solo remoto, o
  presencial/híbrido en México o Brasil), eso simplemente hace que esa señal
  no aparezca por defecto salvo que se elija "ver todas" — es preferible
  ocultarla a asumir que es remota sin evidencia.
- Solo cubre EE.UU. y Canadá por ahora (los dos mercados principales de
  Fast Dolphin); Adzuna tiene más países disponibles si luego hace falta
  ampliarlo (`src/lib/adzuna.ts`, arreglo `ADZUNA_COUNTRIES`).
- Igual que con la sincronización masiva de Apollo, una sincronización de
  Adzuna no manda correo automático al equipo aunque cree señales de
  prioridad alta (para no saturar bandejas cuando trae varias de golpe) —
  el correo automático sigue disparándose solo al confirmar una vacante
  individual a mano.

## Más vacantes reales, sin necesidad de cuenta (RemoteOK y Remotive)

Además de Adzuna, la plataforma también sincroniza con
[RemoteOK](https://remoteok.com) y [Remotive](https://remotive.com), dos
bolsas de empleo enfocadas 100% en trabajo remoto. La diferencia frente a
Adzuna: **ninguna de las dos requiere registrarse ni generar API keys** —
sus APIs son públicas y gratis, así que ambas tarjetas en Configuración
(`/settings`) aparecen siempre como "Conectado", sin ningún paso previo.

Cómo se usa: igual que Adzuna — en Configuración, elige tecnología y dale a
"Sincronizar ahora" en la tarjeta de RemoteOK o Remotive. Cada vacante
encontrada ya trae el link directo a la publicación real, así que las
señales entran **ya confirmadas** (prioridad alta), igual que las de
Adzuna.

Para activarlo:

1. Corre `db/0010_remoteok_remotive.sql` en el SQL Editor de Neon (agrega
   `'remoteok'` y `'remotive'` como fuentes válidas de señal). Es el único
   paso necesario — no hay variables de entorno que configurar.

Limitaciones honestas:

- Ambas son bolsas exclusivamente remotas, así que no hace falta ninguna
  heurística de modalidad como con Adzuna — toda señal creada por
  RemoteOK o Remotive se guarda directamente como `Remoto`.
- RemoteOK no tiene búsqueda por página: cada sincronización descarga el
  feed completo vigente y lo filtra por tecnología, así que con el tiempo
  puede empezar a devolver menos vacantes nuevas (todas ya sincronizadas
  antes) hasta que RemoteOK publique más.
- Remotive sugiere (en su propia documentación) un máximo de ~4 consultas
  diarias por buen uso — la app no lo fuerza por software, así que basta
  con usar el botón "Sincronizar ahora" con moderación (a mano, no en un
  loop automático) para respetarlo.
- Igual que con Adzuna y Apollo, ninguna sincronización manda correo
  automático al equipo aunque cree señales de prioridad alta — el correo
  automático sigue disparándose solo al confirmar una vacante individual a
  mano.
- Tanto RemoteOK como Remotive piden dar crédito/enlazar la publicación
  original al mostrar sus vacantes — se cumple automáticamente porque cada
  señal guarda el link directo (`source_url`) a la publicación real.

## Cargar vacantes de cualquier fuente, no solo LinkedIn

`/leads/new` (antes "Cargar de LinkedIn") ahora deja elegir de dónde salió
la señal — LinkedIn, Indeed, Computrabajo, la página de la empresa, u
otro — con un campo nuevo (`origin_label`, agregado también en
`db/0008_job_boards.sql`). Por dentro se sigue guardando como una señal
manual normal; el cambio es solo que ya no asume que todo viene de
LinkedIn.

## Cambiar el idioma de la plataforma (Español / English)

Toda la interfaz se puede usar en español o en inglés. El selector **ES / EN**
está en la esquina superior del menú lateral (y también en las pantallas de
inicio, login y registro, antes de entrar). No hace falta ninguna migración
nueva ni variable de entorno — el idioma se guarda en una cookie del
navegador (`fd_lang`), no en la cuenta, así que es una preferencia por
dispositivo, como el modo claro/oscuro.

Cómo funciona por dentro, para quien quiera tocarlo:

- `src/lib/i18n.ts` tiene el diccionario completo (español e inglés) en un
  solo lugar. Cualquier texto nuevo de interfaz se agrega ahí, como una
  llave más.
- Los componentes de servidor (páginas `page.tsx`) leen el idioma con
  `getLang()` (`src/lib/getLang.ts`, que lee la cookie) y arman sus textos
  con `getDict(lang)`.
- Los componentes de cliente (botones, formularios interactivos) usan el
  hook `useLanguage()` (`src/components/LanguageProvider.tsx`), que expone
  `t` (el diccionario ya resuelto) y `setLang()` para cambiar de idioma sin
  recargar la página.
- El botón de cambio de idioma es `src/components/LanguageSwitcher.tsx`.

**Lo que todavía queda en español, a propósito** (para no comprometer
calidad por hacerlo a la carrera): el contenido de los borradores de
mensaje de outreach y el "pitch" de por qué Fast Dolphin es relevante
(`src/lib/suggestions.ts`) — es contenido de venta, no texto de interfaz,
y siempre se revisa/edita a mano antes de enviarse, así que se puede
ajustar directamente ahí si lo necesitan en inglés. Los mensajes de error
que vienen tal cual de Apollo.io o de las rutas API tampoco se tradujeron
(muchos son texto dinámico que devuelve el proveedor externo).

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
