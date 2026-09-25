-- ============================================================================
-- Datos de ejemplo para la demo (bórralos cuando conectes datos reales: ver
-- "Pasar de demo a datos reales" en el README).
-- ============================================================================

insert into companies (name, domain, industry, size_range, linkedin_url)
values
  ('Meridian Manufacturing Co.', 'meridianmfg.com', 'Manufactura', '1,000-5,000', 'https://www.linkedin.com/company/meridian-manufacturing'),
  ('NorthPeak Pharma', 'northpeakpharma.com', 'Farmacéutica', '5,000-10,000', 'https://www.linkedin.com/company/northpeak-pharma'),
  ('BrightRiver Financial', 'brightriverfin.com', 'Fintech', '500-1,000', 'https://www.linkedin.com/company/brightriver-financial'),
  ('Solstice Retail Group', 'solsticeretail.com', 'Retail/eCommerce', '10,000+', 'https://www.linkedin.com/company/solstice-retail'),
  ('Vantage Energy Partners', 'vantageenergy.com', 'Energía', '1,000-5,000', 'https://www.linkedin.com/company/vantage-energy'),
  ('Ferro & Cole Consulting', 'ferrocole.com', 'Consultoría IT', '200-500', 'https://www.linkedin.com/company/ferro-cole')
on conflict do nothing;

insert into signals (company_id, title, technology, signal_type, source, source_url, raw_text, status, priority, detected_at)
select c.id, s.title, s.technology, s.signal_type, s.source, s.source_url, s.raw_text, s.status, s.priority, s.detected_at
from (values
  ('Meridian Manufacturing Co.', 'Buscan SAP S/4HANA Consultant Senior (remoto, US)', 'SAP', 'vacante_publicada', 'apollo', 'https://www.linkedin.com/jobs/view/0000001', 'Vacante publicada hace 3 días para consultor SAP S/4HANA con experiencia en manufactura.', 'nuevo', 'alta', now() - interval '2 days'),
  ('NorthPeak Pharma', 'Anunciaron expansión de su equipo de Data/IA para analítica de ensayos clínicos', 'Datos/IA', 'expansion', 'apollo', 'https://www.linkedin.com/posts/northpeak-pharma_0000002', 'Post de LinkedIn anunciando inversión en un equipo de data science.', 'calificando', 'alta', now() - interval '1 day'),
  ('BrightRiver Financial', 'Publicación buscando 3 devs Salesforce para integración con core bancario', 'Salesforce', 'vacante_publicada', 'manual', 'https://www.linkedin.com/jobs/view/0000003', 'Encontrado manualmente en LinkedIn por el equipo comercial.', 'contactado', 'media', now() - interval '5 days'),
  ('Solstice Retail Group', 'Contrataron nuevo VP de Cloud Engineering — probable crecimiento de equipo DevOps', 'Cloud/DevOps', 'contratacion_reciente', 'apollo', 'https://www.linkedin.com/in/example-vp-cloud', 'Señal de intención detectada por cambio de liderazgo en Cloud.', 'en_conversacion', 'media', now() - interval '9 days'),
  ('Vantage Energy Partners', 'Vacante de QA Automation Lead sin cubrir hace 6 semanas', 'QA', 'vacante_publicada', 'apollo', 'https://www.linkedin.com/jobs/view/0000004', 'Vacante lleva abierta varias semanas, posible dificultad para cubrir localmente.', 'nuevo', 'media', now() - interval '12 hours'),
  ('Ferro & Cole Consulting', 'Buscan reforzar su práctica de ciberseguridad con analistas SOC', 'Ciberseguridad', 'vacante_publicada', 'linkedin_import', 'https://www.linkedin.com/jobs/view/0000005', 'Cargado manualmente desde una publicación compartida en el grupo de ventas.', 'reunion_agendada', 'alta', now() - interval '15 days')
) as s(company_name, title, technology, signal_type, source, source_url, raw_text, status, priority, detected_at)
join companies c on c.name = s.company_name
on conflict do nothing;
