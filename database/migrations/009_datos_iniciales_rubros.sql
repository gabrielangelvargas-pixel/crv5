INSERT INTO rubros (id_rubro_padre, codigo, slug, nombre, descripcion, imagen, orden, activo)
VALUES
  (NULL, 'plata_900_925', 'plata-900-925', 'Plata 900 / 925', 'Joyería y accesorios en plata 900 y 925.', NULL, 1, TRUE),
  (NULL, 'acero_quirurgico', 'acero-quirurgico', 'Acero Quirúrgico', 'Accesorios resistentes para uso diario.', NULL, 2, TRUE),
  (NULL, 'marroquineria', 'marroquineria', 'Marroquinería', 'Carteras, billeteras y accesorios.', NULL, 3, TRUE),
  (NULL, 'bazar', 'bazar', 'Bazar', 'Productos funcionales para el hogar y el negocio.', NULL, 4, TRUE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  orden = VALUES(orden),
  activo = TRUE;
