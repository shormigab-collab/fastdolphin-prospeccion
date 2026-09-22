-- RemoteOK y Remotive como nuevas fuentes de señales: dos bolsas de empleo
-- 100% remoto, con API pública, gratis y sin necesidad de llave — a
-- diferencia de Adzuna (que sí pide registro) y de Apollo (que solo compara
-- perfil de empresa, no vacantes reales). Como ambas son bolsas exclusivas
-- de trabajo remoto, cada señal que crean entra directamente como
-- work_mode = 'remoto', sin necesitar ninguna heurística de detección.
--
-- Mismo patrón que db/0009_adzuna.sql: en vez de asumir el nombre de la
-- restricción CHECK de signals.source (Postgres lo genera automáticamente
-- y puede variar), este bloque la busca por su definición real y la
-- reemplaza.
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'signals'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%source%in%'
  loop
    execute format('alter table signals drop constraint %I', r.conname);
  end loop;
end $$;

alter table signals add constraint signals_source_check
  check (source in ('apollo', 'manual', 'linkedin_import', 'adzuna', 'remoteok', 'remotive'));
