INSERT INTO producto_grupos
  (categoria_id, nombre, slug, descripcion, orden)
SELECT padre.id, 'Cartera chica con franja acharolada simil cuero',
  'cartera-chica-franja-acharolada',
  'Cartera chica con franja acharolada simil cuero.', 1
FROM categorias padre
WHERE padre.slug = 'bolsos-carteras'
LIMIT 1;

SET @grupo_cartera = LAST_INSERT_ID();

INSERT INTO productos
  (grupo_id, categoria_id, codigo, nombre, variante, slug, descripcion,
   precio_venta, precio_oferta, stock, imagen_url, etiquetas, orden)
SELECT @grupo_cartera, padre.id, 'MAR-BOL-002',
  'Cartera chica con franja acharolada simil cuero', 'Negra',
  'cartera-chica-franja-negra',
  'Cartera chica práctica para uso diario.', 21700.00, NULL, 10,
  'cartera-franja-negra.png', JSON_ARRAY('cartera', 'negra'), 1
FROM categorias padre
WHERE padre.slug = 'bolsos-carteras'
LIMIT 1;

SET @variante_negra = LAST_INSERT_ID();

INSERT INTO productos
  (grupo_id, categoria_id, codigo, nombre, variante, slug, descripcion,
   precio_venta, precio_oferta, stock, imagen_url, etiquetas, orden)
SELECT @grupo_cartera, padre.id, 'MAR-BOL-003',
  'Cartera chica con franja acharolada simil cuero', 'Suela',
  'cartera-chica-franja-suela',
  'Cartera chica práctica para uso diario.', 21700.00, NULL, 12,
  'cartera-franja-suela.png', JSON_ARRAY('cartera', 'suela'), 2
FROM categorias padre
WHERE padre.slug = 'bolsos-carteras'
LIMIT 1;

SET @variante_suela = LAST_INSERT_ID();

INSERT INTO producto_precios (producto_id, cantidad_minima, precio_unitario)
VALUES
  (@variante_negra, 1, 21700.00),
  (@variante_negra, 3, 20900.00),
  (@variante_suela, 1, 21700.00),
  (@variante_suela, 3, 20900.00);
