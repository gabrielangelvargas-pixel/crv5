CREATE TABLE productos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  categoria_id BIGINT UNSIGNED NOT NULL,
  codigo VARCHAR(13) NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  precio_venta DECIMAL(12,2) NOT NULL,
  precio_oferta DECIMAL(12,2) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  imagen_url VARCHAR(500) NULL,
  etiquetas JSON NULL,
  orden INT UNSIGNED NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_productos_codigo (codigo),
  UNIQUE KEY uq_productos_slug (slug),
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_productos_categoria_activo_orden (categoria_id, activo, orden),
  INDEX idx_productos_activo (activo)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
