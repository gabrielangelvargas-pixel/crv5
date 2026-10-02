CREATE TABLE IF NOT EXISTS carritos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NULL,
  token_hash CHAR(64) NULL,
  items JSON NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 0,
  estado ENUM('activo', 'fusionado', 'convertido', 'confirmado', 'actualizado') NOT NULL DEFAULT 'activo',
  entrega JSON NULL,
  productos_confirmados JSON NULL,
  ajustes JSON NULL,
  total_estimado DECIMAL(14,2) NULL,
  confirmado_en DATETIME NULL,
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_carrito_usuario (usuario_id),
  UNIQUE KEY uq_carrito_token (token_hash),
  KEY idx_carrito_actividad (estado, ultima_actividad)
) ENGINE=InnoDB;
