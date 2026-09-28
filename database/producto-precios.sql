CREATE TABLE producto_precios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id BIGINT UNSIGNED NOT NULL,
  cantidad_minima INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_producto_precios_cantidad (producto_id, cantidad_minima),
  CONSTRAINT fk_producto_precios_producto
    FOREIGN KEY (producto_id)
    REFERENCES productos(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  INDEX idx_producto_precios_producto_activo (producto_id, activo, cantidad_minima)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
