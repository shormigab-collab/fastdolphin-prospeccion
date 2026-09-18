-- Permite marcar una señal como "vacante confirmada" — alguien del equipo
-- verificó a mano que la vacante existe de verdad (revisando LinkedIn,
-- la empresa, etc.), a diferencia de una señal de Apollo.io que solo dice
-- que el perfil de la empresa coincide con una tecnología, sin garantizar
-- que estén contratando ahora mismo.
alter table signals add column if not exists vacancy_confirmed_at timestamptz;
alter table signals add column if not exists vacancy_confirmed_by uuid references users(id);
