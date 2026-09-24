ALTER TABLE `roles_permisos` ADD CONSTRAINT `fk_roles_permisos_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `roles_permisos` ADD CONSTRAINT `fk_roles_permisos_permiso` FOREIGN KEY (`id_permiso`) REFERENCES `permisos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rubros` ADD CONSTRAINT `fk_rubros_padre` FOREIGN KEY (`id_rubro_padre`) REFERENCES `rubros`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sesiones` ADD CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usuarios_roles` ADD CONSTRAINT `fk_usuarios_roles_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usuarios_roles` ADD CONSTRAINT `fk_usuarios_roles_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT IGNORE INTO `roles` (`codigo`, `nombre`, `descripcion`, `activo`) VALUES
  ('admin', 'Administrador', 'Acceso completo a la administracion del sistema.', TRUE),
  ('supervisor', 'Supervisor', 'Gestion operativa de catalogo, clientes, ventas y pedidos.', TRUE),
  ('vendedor', 'Vendedor', 'Gestion de clientes y registro de pedidos y ventas.', TRUE),
  ('cliente', 'Cliente', 'Consulta del catalogo y gestion de sus pedidos.', TRUE);
--> statement-breakpoint
INSERT IGNORE INTO `permisos` (`codigo`, `nombre`, `descripcion`, `modulo`, `accion`, `activo`) VALUES
  ('catalogo_ver', 'Ver catalogo', 'Consultar el catalogo publicado.', 'catalogo', 'ver', TRUE),
  ('productos_ver', 'Ver productos', 'Consultar productos y sus variantes.', 'productos', 'ver', TRUE),
  ('clientes_ver', 'Ver clientes', 'Consultar clientes registrados.', 'clientes', 'ver', TRUE),
  ('ventas_crear', 'Crear ventas', 'Registrar nuevas ventas.', 'ventas', 'crear', TRUE),
  ('ventas_ver', 'Ver ventas', 'Consultar ventas registradas.', 'ventas', 'ver', TRUE),
  ('pedidos_crear', 'Crear pedidos', 'Registrar nuevos pedidos.', 'pedidos', 'crear', TRUE),
  ('pedidos_ver', 'Ver pedidos', 'Consultar pedidos registrados.', 'pedidos', 'ver', TRUE),
  ('usuarios_administrar', 'Administrar usuarios', 'Crear, editar y desactivar usuarios.', 'usuarios', 'administrar', TRUE),
  ('roles_administrar', 'Administrar roles', 'Gestionar roles y permisos.', 'roles', 'administrar', TRUE);
--> statement-breakpoint
INSERT IGNORE INTO `roles_permisos` (`id_rol`, `id_permiso`, `activo`)
SELECT r.id, p.id, TRUE FROM `roles` r CROSS JOIN `permisos` p WHERE r.codigo = 'admin';
--> statement-breakpoint
INSERT IGNORE INTO `roles_permisos` (`id_rol`, `id_permiso`, `activo`)
SELECT r.id, p.id, TRUE FROM `roles` r JOIN `permisos` p ON p.codigo IN (
  'catalogo_ver', 'productos_ver', 'clientes_ver', 'ventas_crear',
  'ventas_ver', 'pedidos_crear', 'pedidos_ver'
) WHERE r.codigo = 'supervisor';
--> statement-breakpoint
INSERT IGNORE INTO `roles_permisos` (`id_rol`, `id_permiso`, `activo`)
SELECT r.id, p.id, TRUE FROM `roles` r JOIN `permisos` p ON p.codigo IN (
  'catalogo_ver', 'clientes_ver', 'ventas_crear', 'pedidos_crear'
) WHERE r.codigo = 'vendedor';
--> statement-breakpoint
INSERT IGNORE INTO `roles_permisos` (`id_rol`, `id_permiso`, `activo`)
SELECT r.id, p.id, TRUE FROM `roles` r JOIN `permisos` p ON p.codigo IN (
  'catalogo_ver', 'pedidos_crear', 'pedidos_ver'
) WHERE r.codigo = 'cliente';
