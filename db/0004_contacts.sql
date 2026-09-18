-- Datos de contacto (RRHH / Talent Acquisition) que la plataforma busca en
-- Apollo.io bajo demanda, botón "Buscar contacto" en el detalle de la señal.
-- No se llenan automáticamente al sincronizar (para no gastar créditos de
-- Apollo sin que el equipo lo decida).

alter table signals add column if not exists contact_name text;
alter table signals add column if not exists contact_title text;
alter table signals add column if not exists contact_email text;
alter table signals add column if not exists contact_phone text;
alter table signals add column if not exists contact_linkedin_url text;
alter table signals add column if not exists contact_looked_up_at timestamptz;
