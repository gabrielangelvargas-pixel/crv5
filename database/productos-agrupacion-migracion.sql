ALTER TABLE productos
  ADD COLUMN grupo_id BIGINT UNSIGNED NULL AFTER id,
  ADD COLUMN variante VARCHAR(80) NULL AFTER nombre,
  ADD INDEX idx_productos_grupo (grupo_id),
  ADD CONSTRAINT fk_productos_grupo
    FOREIGN KEY (grupo_id)
    REFERENCES producto_grupos(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
