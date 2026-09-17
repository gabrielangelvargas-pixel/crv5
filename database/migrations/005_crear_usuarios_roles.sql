CREATE TABLE IF NOT EXISTS usuarios_roles (
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_rol TINYINT UNSIGNED NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_rol),
  KEY idx_usuarios_roles_rol (id_rol),
  CONSTRAINT fk_usuarios_roles_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_usuarios_roles_rol
    FOREIGN KEY (id_rol) REFERENCES roles (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
