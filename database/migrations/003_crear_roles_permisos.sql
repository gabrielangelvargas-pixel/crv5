CREATE TABLE IF NOT EXISTS roles_permisos (
  id_rol TINYINT UNSIGNED NOT NULL,
  id_permiso SMALLINT UNSIGNED NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_rol, id_permiso),
  KEY idx_roles_permisos_permiso (id_permiso),
  CONSTRAINT fk_roles_permisos_rol
    FOREIGN KEY (id_rol) REFERENCES roles (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_roles_permisos_permiso
    FOREIGN KEY (id_permiso) REFERENCES permisos (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
