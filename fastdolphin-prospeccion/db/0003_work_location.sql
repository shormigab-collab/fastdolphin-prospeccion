-- ============================================================================
-- Modalidad y ubicación de cada señal: Fast Dolphin solo quiere perseguir
-- vacantes remotas, o presenciales/híbridas específicamente en México o
-- Brasil (donde tienen talento nearshore físico). Corre esto en el SQL
-- Editor de Neon después de 0001_init.sql (y 0002_seed_demo.sql si ya lo
-- corriste antes).
-- ============================================================================

alter table signals
  add column if not exists work_mode text not null default 'remoto'
    check (work_mode in ('remoto', 'hibrido', 'presencial'));

alter table signals
  add column if not exists location text;

-- Dos señales de ejemplo pasan a ser presenciales en México/Brasil, para que
-- la demo muestre ambos casos (remoto y presencial LatAm). El resto de
-- señales de ejemplo queda como "remoto" por el valor por defecto de arriba.
update signals set work_mode = 'presencial', location = 'Ciudad de México, México'
where company_id = (select id from companies where name = 'Ferro & Cole Consulting');

update signals set work_mode = 'presencial', location = 'São Paulo, Brasil'
where company_id = (select id from companies where name = 'Vantage Energy Partners');
