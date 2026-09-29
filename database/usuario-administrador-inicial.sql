-- Usuario inicial para probar el acceso a la aplicación.
-- Credenciales temporales:
-- Usuario: admin
-- Contraseña: CambiarMe-2026!
-- Cambiar esta contraseña después del primer acceso.

START TRANSACTION;

INSERT INTO roles (codigo, nombre, descripcion, activo)
VALUES (
  'admin',
  'Administrador',
  'Acceso completo a la aplicación.',
  1
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  activo = 1;

SET @rol_administrador = LAST_INSERT_ID();

INSERT INTO usuarios (nombre, usuario, clave_hash, activo)
VALUES (
  'Administrador CRV4',
  'admin',
  '$2b$12$9MwloqwIwK4D22IvzsZ8l.DTl.maqptZmjOYnkHVjgEQHKGlmbgBO',
  1
)
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  activo = 1;

SET @usuario_administrador = LAST_INSERT_ID();

INSERT INTO usuarios_roles (id_usuario, id_rol, activo)
VALUES (@usuario_administrador, @rol_administrador, 1)
ON DUPLICATE KEY UPDATE activo = 1;

COMMIT;
