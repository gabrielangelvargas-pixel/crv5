UPDATE rubros
SET imagen = CASE
  WHEN slug IN ('plata', 'plata-900-925') THEN '/images/rubros/plata-900.png'
  WHEN slug = 'acero-quirurgico' THEN '/images/rubros/acero-quirurgico.png'
  WHEN slug = 'marroquineria' THEN '/images/rubros/marroquineria.png'
  WHEN slug = 'bazar' THEN '/images/rubros/bazar.png'
  ELSE imagen
END
WHERE slug IN ('plata', 'plata-900-925', 'acero-quirurgico', 'marroquineria', 'bazar');
