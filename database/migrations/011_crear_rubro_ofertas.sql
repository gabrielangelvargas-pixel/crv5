INSERT INTO rubros (id_rubro_padre, codigo, slug, nombre, descripcion, imagen, orden, activo)
VALUES (NULL, 'ofertas', 'ofertas', 'Ofertas', 'Promociones y oportunidades especiales.', '/images/rubros/oferta.png', 5, TRUE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  imagen = VALUES(imagen),
  orden = VALUES(orden),
  activo = TRUE;
