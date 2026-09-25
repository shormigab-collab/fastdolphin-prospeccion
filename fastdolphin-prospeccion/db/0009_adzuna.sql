-- Adzuna como nueva fuente de señales: vacantes reales encontradas por
-- palabra clave de tecnología en su buscador (EE.UU., Canadá y más),
-- a diferencia de Apollo (que solo compara el perfil de la empresa).
--
-- La columna signals.source tiene una restricción CHECK que hoy solo
-- permite 'apollo' | 'manual' | 'linkedin_import'. En vez de asumir cómo
-- se llama esa restricción (Postgres la nombra automáticamente y el
-- nombre puede variar), este bloque la busca por su definición real y la
-- reemplaza — así funciona sin importar cómo haya quedado nombrada.
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
  check (source in ('apollo', 'manual', 'linkedin_import', 'adzuna'));
