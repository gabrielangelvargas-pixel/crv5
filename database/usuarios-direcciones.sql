CREATE TABLE IF NOT EXISTS usuarios_direcciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT UNSIGNED NOT NULL,
  etiqueta ENUM('casa', 'trabajo', 'deposito', 'otro') NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  direccion VARCHAR(180) NOT NULL,
  barrio VARCHAR(100) NULL,
  localidad VARCHAR(100) NOT NULL,
  provincia VARCHAR(100) NOT NULL,
  codigo_postal VARCHAR(15) NULL,
  referencia VARCHAR(255) NULL,
  predeterminada TINYINT(1) NOT NULL DEFAULT 0,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  creada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_direcciones_usuario (id_usuario),
  INDEX idx_direcciones_usuario_activa (id_usuario, activa),
  CONSTRAINT fk_direcciones_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
