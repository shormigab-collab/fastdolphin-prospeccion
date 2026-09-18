-- Soporte de datos para el rediseño de la interfaz:
--   * Asunto de correo en los borradores de outreach (la pestaña "Correo"
--     del editor de mensajes ahora tiene su propio campo Asunto).
--   * Id de la persona en Apollo.io y estado del correo revelado, para el
--     botón "Ver contacto en Apollo" y la etiqueta "Estado de contacto" en
--     el detalle de la señal.

alter table messages add column if not exists subject text;

alter table signals add column if not exists contact_apollo_id text;
alter table signals add column if not exists contact_email_status text;
