-- Permite iniciar sesión con Google (cuenta @fastdolphin.com de Google
-- Workspace), además del login por correo/contraseña que ya existía.
--
-- Una cuenta creada por Google no tiene contraseña propia en la app, así
-- que password_hash ya no puede ser obligatorio.
alter table users alter column password_hash drop not null;
