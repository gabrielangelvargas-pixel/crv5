CREATE TABLE IF NOT EXISTS rubros (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_rubro_padre SMALLINT UNSIGNED NULL,
  codigo VARCHAR(40) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  imagen VARCHAR(500) NULL,
  orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rubros_codigo (codigo),
  UNIQUE KEY uq_rubros_slug (slug),
  KEY idx_rubros_padre (id_rubro_padre),
  KEY idx_rubros_orden (activo, id_rubro_padre, orden),
  CONSTRAINT fk_rubros_padre
    FOREIGN KEY (id_rubro_padre) REFERENCES rubros (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
