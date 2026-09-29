INSERT INTO roles (codigo, nombre, descripcion, activo)
VALUES
  ('admin', 'Administrador', 'Acceso completo a la aplicación.', 1),
  ('supervisor', 'Supervisor', 'Gestión operativa de catálogo, clientes y ventas.', 1),
  ('vendedor', 'Vendedor', 'Acceso a la gestión comercial.', 1),
  ('cliente', 'Cliente', 'Acceso al catálogo, pedidos y perfil propio.', 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  activo = 1;
