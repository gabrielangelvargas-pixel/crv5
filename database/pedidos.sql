CREATE TABLE IF NOT EXISTS pedidos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  carrito_id CHAR(36) NOT NULL,
  clave_confirmacion CHAR(36) NOT NULL,
  estado ENUM('pendiente_revision','esperando_pago','cerrado','cancelado') NOT NULL DEFAULT 'pendiente_revision',
  productos JSON NOT NULL,
  entrega JSON NOT NULL,
  ajustes JSON NULL,
  total_estimado DECIMAL(14,2) NOT NULL,
  total_confirmado DECIMAL(14,2) NULL,
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pedido_carrito (carrito_id),
  UNIQUE KEY uq_pedido_confirmacion (usuario_id, clave_confirmacion),
  KEY idx_pedido_usuario (usuario_id, creado),
  KEY idx_pedido_estado (estado, creado)
) ENGINE=InnoDB;
