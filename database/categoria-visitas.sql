CREATE TABLE categoria_visitas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  categoria_id BIGINT UNSIGNED NOT NULL,
  visitante_id CHAR(36) NOT NULL,
  fecha DATE NOT NULL,
  visitas INT UNSIGNED NOT NULL DEFAULT 1,
  fuente VARCHAR(80) NULL,
  medio VARCHAR(80) NULL,
  campania VARCHAR(120) NULL,
  primera_visita DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_visita DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_categoria_visitas_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  UNIQUE KEY uq_categoria_visitas_visitante_dia
    (categoria_id, visitante_id, fecha),
  INDEX idx_categoria_visitas_categoria_fecha
    (categoria_id, fecha),
  INDEX idx_categoria_visitas_fecha
    (fecha)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

