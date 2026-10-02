CREATE TABLE IF NOT EXISTS carrito_reservas (
  carrito_id CHAR(36) NOT NULL,
  producto_id BIGINT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  PRIMARY KEY (carrito_id, producto_id),
  KEY idx_reserva_producto (producto_id),
  CONSTRAINT fk_reserva_carrito FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
  CONSTRAINT fk_reserva_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;
