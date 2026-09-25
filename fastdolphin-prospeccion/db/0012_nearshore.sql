-- Marca honesta de "posible nearshore": no es un dato que Adzuna, RemoteOK
-- o Remotive clasifiquen — se calcula buscando palabras clave ("nearshore",
-- "LatAm", etc.) en el título/ubicación/descripción de cada vacante al
-- sincronizar (ver src/lib/nearshore.ts). Por eso default false y nunca se
-- presenta en la interfaz como un dato certero, siempre como "posible".
alter table signals add column if not exists mentions_nearshore boolean not null default false;

create index if not exists signals_mentions_nearshore_idx on signals (mentions_nearshore)
  where mentions_nearshore;
