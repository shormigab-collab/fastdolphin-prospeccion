-- Link a la bolsa de empleo pública de la empresa (Greenhouse, Lever, etc.)
-- — se usa para consultar automáticamente si tienen vacantes abiertas de
-- verdad, en vez de depender solo de que alguien lo revise a mano.
alter table companies add column if not exists careers_url text;

-- De dónde salió exactamente una señal cargada manualmente (LinkedIn,
-- Indeed, Computrabajo, la página de la empresa, etc.) — antes esto
-- asumía que siempre era LinkedIn.
alter table signals add column if not exists origin_label text;
