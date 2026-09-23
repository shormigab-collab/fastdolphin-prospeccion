-- Seguimiento programado por señal: fecha (y nota opcional) del próximo
-- paso a dar. Antes la plataforma no tenía forma de decir "hay que volver
-- a escribirle a esta empresa el jueves" — quedaba solo en la cabeza de
-- quien lo vio. Con esto, "Oportunidades" y "Actividad" pueden mostrar de
-- verdad qué está vencido y qué toca hoy, en vez de inventar fechas.
alter table signals add column if not exists next_follow_up_at date;
alter table signals add column if not exists next_follow_up_note text;

create index if not exists signals_next_follow_up_idx on signals (next_follow_up_at);
