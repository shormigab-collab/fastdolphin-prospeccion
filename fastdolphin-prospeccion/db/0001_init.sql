-- ============================================================================
-- Fast Dolphin · Plataforma de Prospección
-- Esquema para Neon (Postgres estándar, sin extensiones de Supabase).
-- Corre esto en el "SQL Editor" de tu proyecto de Neon (o con psql / el
-- cliente que prefieras) antes de usar la app.
-- ============================================================================

create extension if not exists pgcrypto; -- para gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 0. Dominios de correo permitidos para crear cuenta
-- ---------------------------------------------------------------------------
create table if not exists allowed_domains (
  domain text primary key
);

insert into allowed_domains (domain)
values ('fastdolphin.com')
on conflict (domain) do nothing;

-- ---------------------------------------------------------------------------
-- 1. users — cuentas del equipo (login propio con NextAuth, sin Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  role text not null default 'rep' check (role in ('admin', 'rep')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. companies — empresas detectadas como oportunidad
-- ---------------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  industry text,
  size_range text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. signals — cada oportunidad/lead de prospección detectada
-- ---------------------------------------------------------------------------
create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies (id) on delete cascade,
  title text not null,
  technology text not null check (
    technology in ('SAP', 'Oracle', 'Salesforce', 'Cloud/DevOps', 'Datos/IA', 'Desarrollo', 'QA', 'Ciberseguridad', 'PM/Consultoría')
  ),
  signal_type text not null default 'vacante_publicada' check (
    signal_type in ('vacante_publicada', 'contratacion_reciente', 'expansion', 'tecnologia_detectada', 'otro')
  ),
  source text not null default 'manual' check (source in ('apollo', 'manual', 'linkedin_import')),
  source_url text,
  raw_text text,
  status text not null default 'nuevo' check (
    status in ('nuevo', 'calificando', 'contactado', 'en_conversacion', 'reunion_agendada', 'ganado', 'descartado')
  ),
  priority text not null default 'media' check (priority in ('alta', 'media', 'baja')),
  assigned_to uuid references users (id),
  detected_at timestamptz not null default now(),
  created_by uuid references users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists signals_status_idx on signals (status);
create index if not exists signals_technology_idx on signals (technology);
create index if not exists signals_assigned_to_idx on signals (assigned_to);

-- ---------------------------------------------------------------------------
-- 4. messages — borradores de outreach, con aprobación manual antes de
--    marcarse como enviados (nunca se envían automáticamente)
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references signals (id) on delete cascade,
  channel text not null default 'linkedin' check (channel in ('linkedin', 'email')),
  draft_text text not null,
  status text not null default 'pendiente_aprobacion' check (
    status in ('pendiente_aprobacion', 'aprobado', 'enviado', 'descartado')
  ),
  suggested_by text not null default 'system' check (suggested_by in ('system', 'user')),
  approved_by uuid references users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_signal_id_idx on messages (signal_id);

-- ---------------------------------------------------------------------------
-- 5. notes — bitácora de seguimiento por señal
-- ---------------------------------------------------------------------------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null references signals (id) on delete cascade,
  author_id uuid references users (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. updated_at automático en signals
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists signals_set_updated_at on signals;
create trigger signals_set_updated_at
  before update on signals
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------------
-- Nota sobre permisos: a diferencia de Supabase, Neon no trae Row Level
-- Security ligado a un sistema de auth propio. El control de acceso aquí se
-- hace en la aplicación (NextAuth exige sesión válida para /dashboard,
-- /leads y /settings — ver src/middleware.ts) y la restricción de dominio se
-- aplica al crear la cuenta (ver src/app/api/register/route.ts), no a nivel
-- de fila en la base de datos.
-- ---------------------------------------------------------------------------
