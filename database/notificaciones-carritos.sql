CREATE TABLE IF NOT EXISTS notificaciones_carritos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  carrito_id CHAR(36) NOT NULL,
  version INT UNSIGNED NOT NULL,
  cliente VARCHAR(180) NOT NULL,
  productos INT UNSIGNED NOT NULL,
  unidades INT UNSIGNED NOT NULL,
  total_estimado DECIMAL(14,2) NOT NULL,
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leido_en DATETIME NULL,
  UNIQUE KEY uq_aviso_carrito (usuario_id, carrito_id, version),
  KEY idx_aviso_usuario (usuario_id, leido_en, creado),
  CONSTRAINT fk_aviso_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_aviso_carrito FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
