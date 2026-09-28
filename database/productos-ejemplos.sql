INSERT INTO productos
  (categoria_id, codigo, nombre, slug, descripcion, precio_venta, precio_oferta, stock, imagen_url, etiquetas, orden)
SELECT c.id, 'MAR-MOC-001', 'Mochila urbana mini', 'mochila-urbana-mini',
  'Mochila urbana compacta para uso diario.', 11200.00, NULL, 14, NULL,
  JSON_ARRAY('urbana'), 1
FROM categorias c
INNER JOIN categorias padre ON padre.id = c.parent_id
WHERE c.slug = 'mochilas' AND padre.slug = 'marroquineria'
LIMIT 1;

INSERT INTO productos
  (categoria_id, codigo, nombre, slug, descripcion, precio_venta, precio_oferta, stock, imagen_url, etiquetas, orden)
SELECT c.id, 'MAR-BOL-001', 'Bolso bandolera', 'bolso-bandolera',
  'Bolso bandolera práctico para uso diario.', 8900.00, 8200.00, 18, NULL,
  JSON_ARRAY('bandolera'), 2
FROM categorias c
INNER JOIN categorias padre ON padre.id = c.parent_id
WHERE c.slug = 'bolsos-carteras' AND padre.slug = 'marroquineria'
LIMIT 1;

INSERT INTO productos
  (categoria_id, codigo, nombre, slug, descripcion, precio_venta, precio_oferta, stock, imagen_url, etiquetas, orden)
SELECT c.id, 'ACE-DOR-001', 'Aros acero dorado', 'aros-acero-dorado',
  'Aros de acero dorado para venta mayorista.', 4200.00, NULL, 30, NULL,
  JSON_ARRAY('acero', 'dorado'), 3
FROM categorias c
WHERE c.slug = 'acero-dorado'
LIMIT 1;
