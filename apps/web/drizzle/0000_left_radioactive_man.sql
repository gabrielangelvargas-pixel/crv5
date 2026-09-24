CREATE TABLE `permisos` (
	`id` smallint unsigned AUTO_INCREMENT NOT NULL,
	`codigo` varchar(80) NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`descripcion` text,
	`modulo` varchar(60) NOT NULL,
	`accion` varchar(40) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`creado` timestamp NOT NULL DEFAULT (now()),
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `permisos_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_permisos_codigo` UNIQUE(`codigo`),
	CONSTRAINT `uq_permisos_modulo_accion` UNIQUE(`modulo`,`accion`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` tinyint unsigned AUTO_INCREMENT NOT NULL,
	`codigo` varchar(40) NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`descripcion` text,
	`activo` boolean NOT NULL DEFAULT true,
	`creado` timestamp NOT NULL DEFAULT (now()),
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_roles_codigo` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `roles_permisos` (
	`id_rol` tinyint unsigned NOT NULL,
	`id_permiso` smallint unsigned NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`creado` timestamp NOT NULL DEFAULT (now()),
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_permisos_id_rol_id_permiso_pk` PRIMARY KEY(`id_rol`,`id_permiso`)
);
--> statement-breakpoint
CREATE TABLE `rubros` (
	`id` smallint unsigned AUTO_INCREMENT NOT NULL,
	`id_rubro_padre` smallint unsigned,
	`codigo` varchar(40) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`nombre` varchar(150) NOT NULL,
	`descripcion` text,
	`imagen` varchar(500),
	`orden` smallint unsigned NOT NULL DEFAULT 0,
	`activo` boolean NOT NULL DEFAULT true,
	`creado` timestamp NOT NULL DEFAULT (now()),
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rubros_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_rubros_codigo` UNIQUE(`codigo`),
	CONSTRAINT `uq_rubros_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sesiones` (
	`id` char(36) NOT NULL,
	`id_usuario` int unsigned NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expira_en` datetime,
	`revocada_en` datetime,
	`creado` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sesiones_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_sesiones_token_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`usuario` varchar(80) NOT NULL,
	`clave_hash` varchar(255) NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`ultimo_acceso` datetime,
	`creado` timestamp NOT NULL DEFAULT (now()),
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_usuarios_usuario` UNIQUE(`usuario`)
);
--> statement-breakpoint
CREATE TABLE `usuarios_roles` (
	`id_usuario` int unsigned NOT NULL,
	`id_rol` tinyint unsigned NOT NULL,
	`activo` boolean NOT NULL DEFAULT true,
	`creado` timestamp NOT NULL DEFAULT (now()),
	`actualizado` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usuarios_roles_id_usuario_id_rol_pk` PRIMARY KEY(`id_usuario`,`id_rol`)
);
--> statement-breakpoint
CREATE INDEX `idx_roles_permisos_permiso` ON `roles_permisos` (`id_permiso`);--> statement-breakpoint
CREATE INDEX `idx_rubros_padre` ON `rubros` (`id_rubro_padre`);--> statement-breakpoint
CREATE INDEX `idx_rubros_orden` ON `rubros` (`activo`,`id_rubro_padre`,`orden`);--> statement-breakpoint
CREATE INDEX `idx_sesiones_usuario` ON `sesiones` (`id_usuario`);--> statement-breakpoint
CREATE INDEX `idx_sesiones_expiracion` ON `sesiones` (`expira_en`);--> statement-breakpoint
CREATE INDEX `idx_usuarios_activo` ON `usuarios` (`activo`);--> statement-breakpoint
CREATE INDEX `idx_usuarios_roles_rol` ON `usuarios_roles` (`id_rol`);