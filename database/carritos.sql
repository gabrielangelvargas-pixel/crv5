CREATE TABLE IF NOT EXISTS carritos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NULL,
  token_hash CHAR(64) NULL,
  items JSON NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 0,
  estado ENUM('activo', 'fusionado', 'convertido') NOT NULL DEFAULT 'activo',
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_carrito_usuario (usuario_id),
  UNIQUE KEY uq_carrito_token (token_hash),
  KEY idx_carrito_actividad (estado, ultima_actividad)
) ENGINE=InnoDB;
