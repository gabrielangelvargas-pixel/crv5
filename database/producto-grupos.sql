CREATE TABLE producto_grupos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  categoria_id BIGINT UNSIGNED NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  descripcion TEXT NULL,
  orden INT UNSIGNED NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_producto_grupos_slug (slug),
  CONSTRAINT fk_producto_grupos_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX idx_producto_grupos_categoria_activo_orden (categoria_id, activo, orden)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
