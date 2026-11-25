-- Seed 002: 18 realistic study bookstore products with technical attributes (idempotent)

SET NAMES utf8mb4;

INSERT INTO products (
  category_id, brand_id, sku, isbn, title, slug, short_description,
  unit_label, units_per_pack, price, stock_available, stock_reserved, image_url, is_active
)
VALUES
  -- Cuadernos y Papel (4)
  (
    (SELECT id FROM categories WHERE slug = 'cuadernos-y-papel'),
    (SELECT id FROM brands WHERE slug = 'norma'),
    'NRM-CUA-100-CC', NULL,
    'Cuaderno Universitario Norma Cosido 100 Hojas Cuadro Chico',
    'cuaderno-universitario-norma-cosido-100-hojas-cuadro-chico',
    'Cuaderno profesional pasta dura cosido con papel bond de alta blancura 75 g/m2 y margen rojo.',
    'unidad', 1, 4.50, 120, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'cuadernos-y-papel'),
    (SELECT id FROM brands WHERE slug = 'scribe'),
    'SCR-CUA-100-RY', NULL,
    'Cuaderno Profesional Scribe Espiral Doble 100 Hojas Rayado',
    'cuaderno-profesional-scribe-espiral-doble-100-hojas-rayado',
    'Cuaderno con espiral metálico doble y hojas microperforadas tamaño carta para apuntes diarios.',
    'unidad', 1, 3.80, 150, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'cuadernos-y-papel'),
    (SELECT id FROM brands WHERE slug = 'norma'),
    'NRM-CUA-080-CG', NULL,
    'Cuaderno Escolar Norma 80 Hojas Cuadro Grande',
    'cuaderno-escolar-norma-80-hojas-cuadro-grande',
    'Cuaderno formato media carta con cuadrícula de 7 mm ideal para primeros años de primaria.',
    'unidad', 1, 2.60, 200, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'cuadernos-y-papel'),
    (SELECT id FROM brands WHERE slug = 'scribe'),
    'SCR-RES-500-75', NULL,
    'Resma Papel Bond Scribe Carta 75g 500 Hojas',
    'resma-papel-bond-scribe-carta-75g-500-hojas',
    'Papel multipropósito ultra blanco libre de ácido para impresión de tareas, guías y trabajos.',
    'resma x 500', 500, 6.90, 85, 0, '/assets/images/products/placeholder-product.webp', 1
  ),

  -- Libros y Textos (4)
  (
    (SELECT id FROM categories WHERE slug = 'libros-y-textos'),
    (SELECT id FROM brands WHERE slug = 'santillana'),
    'SNT-LIB-MAT-PRI6', '9786070145124',
    'Matemáticas 6 Primaria Serie Saberes Santillana',
    'matematicas-6-primaria-serie-saberes-santillana',
    'Libro de texto con ejercicios resueltos, problemas aplicados y evaluaciones por trimestre.',
    'unidad', 1, 24.50, 45, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'libros-y-textos'),
    (SELECT id FROM brands WHERE slug = 'santillana'),
    'SNT-LIB-LEN-SEC2', '9786070148309',
    'Lengua y Literatura 2 Secundaria Santillana',
    'lengua-y-literatura-2-secundaria-santillana',
    'Texto escolar de comprensión lectora, gramática normativa y redacción académica.',
    'unidad', 1, 26.00, 38, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'libros-y-textos'),
    (SELECT id FROM brands WHERE slug = 'santillana'),
    'SNT-DIC-ESP-2026', '9786070151026',
    'Diccionario Escolar de la Lengua Española Santillana',
    'diccionario-escolar-lengua-espanola-santillana',
    'Más de 30,000 definiciones claras con ejemplos de uso, sinónimos y apéndice ortográfico.',
    'unidad', 1, 14.90, 60, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'libros-y-textos'),
    (SELECT id FROM brands WHERE slug = 'santillana'),
    'SNT-LIB-FIS-BACH', '9786070153402',
    'Física General Bachillerato y Preuniversitario Santillana',
    'fisica-general-bachillerato-preuniversitario-santillana',
    'Cobertura completa de mecánica, termodinámica, ondas y electromagnetismo con laboratorios.',
    'unidad', 1, 32.00, 30, 0, '/assets/images/products/placeholder-product.webp', 1
  ),

  -- Escritura y Arte (4)
  (
    (SELECT id FROM categories WHERE slug = 'escritura-y-arte'),
    (SELECT id FROM brands WHERE slug = 'faber-castell'),
    'FBC-LAP-HB2-12', NULL,
    'Caja x 12 Lápices de Grafito Faber-Castell Castell 9000 HB',
    'caja-12-lapices-grafito-faber-castell-9000-hb',
    'Lápices hexagonales de madera certificada con mina resistente a la rotura para escritura y dibujo.',
    'caja x 12', 12, 8.40, 110, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'escritura-y-arte'),
    (SELECT id FROM brands WHERE slug = 'faber-castell'),
    'FBC-COL-24-ECO', NULL,
    'Lápices de Colores Faber-Castell EcoLápiz Caja x 24',
    'lapices-colores-faber-castell-ecolapiz-caja-24',
    'Colores intensos de trazo suave con pigmentos no tóxicos y sacapuntas incluido.',
    'caja x 24', 24, 9.75, 95, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'escritura-y-arte'),
    (SELECT id FROM brands WHERE slug = 'staedtler'),
    'STD-BOL-AZU-10', NULL,
    'Bolígrafos Staedtler Ball 432M Punta Media Azul x 10',
    'boligrafos-staedtler-ball-432m-punta-media-azul-10',
    'Tinta de secado rápido y trazo continuo de 1.0 mm con cuerpo triangular ergonómico.',
    'caja x 10', 10, 5.20, 140, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'escritura-y-arte'),
    (SELECT id FROM brands WHERE slug = 'faber-castell'),
    'FBC-TEM-06-ART', NULL,
    'Témperas Escolares Faber-Castell Estuche x 6 Colores 15ml',
    'temperas-escolares-faber-castell-estuche-6-colores',
    'Pinturas lavables de alta cobertura mezclables entre sí para proyectos escolares de arte.',
    'estuche x 6', 6, 4.90, 75, 0, '/assets/images/products/placeholder-product.webp', 1
  ),

  -- Geometría y Cálculo (4)
  (
    (SELECT id FROM categories WHERE slug = 'geometria-y-calculo'),
    (SELECT id FROM brands WHERE slug = 'casio'),
    'CAS-CAL-FX991', NULL,
    'Calculadora Científica Casio fx-991LA CW ClassWiz',
    'calculadora-cientifica-casio-fx-991la-cw-classwiz',
    'Pantalla de alta resolución con 540+ funciones, resolución de matrices, vectores y estadística.',
    'unidad', 1, 29.90, 50, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'geometria-y-calculo'),
    (SELECT id FROM brands WHERE slug = 'staedtler'),
    'STD-JGO-GEO-4P', NULL,
    'Juego Geométrico Staedtler Mars 4 Piezas Irrompible',
    'juego-geometrico-staedtler-mars-4-piezas',
    'Regla de 30 cm, escuadra, cartabón y transportador 180 grados en acrílico flexible graduado.',
    'set x 4', 4, 6.50, 90, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'geometria-y-calculo'),
    (SELECT id FROM brands WHERE slug = 'staedtler'),
    'STD-COM-550-01', NULL,
    'Compás de Precisión Staedtler Mars Comfort con Rueda Central',
    'compas-precision-staedtler-mars-comfort-rueda-central',
    'Compás metálico profesional con ajuste micrométrico y estuche con minas de repuesto.',
    'unidad', 1, 16.80, 42, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'geometria-y-calculo'),
    (SELECT id FROM brands WHERE slug = 'casio'),
    'CAS-CAL-FX82MS', NULL,
    'Calculadora Científica Casio fx-82MS 2da Edición',
    'calculadora-cientifica-casio-fx-82ms-2da-edicion',
    'Calculadora aprobada para exámenes de secundaria con 240 funciones y pantalla de 2 líneas.',
    'unidad', 1, 18.50, 70, 0, '/assets/images/products/placeholder-product.webp', 1
  ),

  -- Combos Escolares (2)
  (
    (SELECT id FROM categories WHERE slug = 'combos-escolares'),
    (SELECT id FROM brands WHERE slug = 'norma'),
    'NRM-CMB-PRI-01', NULL,
    'Combo Escolar Primaria Completo 14 Piezas',
    'combo-escolar-primaria-completo-14-piezas',
    'Incluye 4 cuadernos cuadro grande, caja de 12 colores, 4 lápices HB, borrador, sacapuntas, regla y tijera.',
    'combo x 14', 14, 21.90, 40, 0, '/assets/images/products/placeholder-product.webp', 1
  ),
  (
    (SELECT id FROM categories WHERE slug = 'combos-escolares'),
    (SELECT id FROM brands WHERE slug = 'scribe'),
    'SCR-CMB-UNI-01', NULL,
    'Combo Universitario Ingeniería y Ciencias 10 Piezas',
    'combo-universitario-ingenieria-ciencias-10-piezas',
    'Incluye 5 cuadernos cuadro chico 100 hojas, resma carta 75g, juego geométrico y paquete de bolígrafos.',
    'combo x 10', 10, 28.50, 35, 0, '/assets/images/products/placeholder-product.webp', 1
  )
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  brand_id = VALUES(brand_id),
  isbn = VALUES(isbn),
  title = VALUES(title),
  short_description = VALUES(short_description),
  unit_label = VALUES(unit_label),
  units_per_pack = VALUES(units_per_pack),
  price = VALUES(price),
  stock_available = VALUES(stock_available),
  is_active = VALUES(is_active);

-- Technical attributes for filtering, search, and school list quotation
INSERT INTO product_attributes (product_id, attribute_key, attribute_value, display_label)
VALUES
  -- NRM-CUA-100-CC
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-100-CC'), 'ruling_type', 'cuadro_chico', 'Cuadro chico (5 mm)'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-100-CC'), 'sheet_count', '100', '100 hojas'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-100-CC'), 'paper_weight_gsm', '75', '75 g/m²'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-100-CC'), 'format_size', 'carta', 'Profesional / Carta'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-100-CC'), 'education_level', 'universidad', 'Secundaria / Universidad'),

  -- SCR-CUA-100-RY
  ((SELECT id FROM products WHERE sku = 'SCR-CUA-100-RY'), 'ruling_type', 'rayado', 'Rayado'),
  ((SELECT id FROM products WHERE sku = 'SCR-CUA-100-RY'), 'sheet_count', '100', '100 hojas'),
  ((SELECT id FROM products WHERE sku = 'SCR-CUA-100-RY'), 'paper_weight_gsm', '70', '70 g/m²'),
  ((SELECT id FROM products WHERE sku = 'SCR-CUA-100-RY'), 'format_size', 'carta', 'Profesional / Carta'),
  ((SELECT id FROM products WHERE sku = 'SCR-CUA-100-RY'), 'education_level', 'secundaria', 'Secundaria / Universidad'),

  -- NRM-CUA-080-CG
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-080-CG'), 'ruling_type', 'cuadro_grande', 'Cuadro grande (7 mm)'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-080-CG'), 'sheet_count', '80', '80 hojas'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-080-CG'), 'paper_weight_gsm', '75', '75 g/m²'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-080-CG'), 'format_size', 'media_carta', 'Escolar / Media carta'),
  ((SELECT id FROM products WHERE sku = 'NRM-CUA-080-CG'), 'education_level', 'primaria', 'Primaria'),

  -- SCR-RES-500-75
  ((SELECT id FROM products WHERE sku = 'SCR-RES-500-75'), 'ruling_type', 'blanco', 'Blanco liso'),
  ((SELECT id FROM products WHERE sku = 'SCR-RES-500-75'), 'sheet_count', '500', '500 hojas'),
  ((SELECT id FROM products WHERE sku = 'SCR-RES-500-75'), 'paper_weight_gsm', '75', '75 g/m²'),
  ((SELECT id FROM products WHERE sku = 'SCR-RES-500-75'), 'format_size', 'carta', 'Carta (21.6 x 27.9 cm)'),
  ((SELECT id FROM products WHERE sku = 'SCR-RES-500-75'), 'education_level', 'general', 'Todos los niveles'),

  -- SNT-LIB-MAT-PRI6
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-MAT-PRI6'), 'education_level', 'primaria', '6° de Primaria'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-MAT-PRI6'), 'edition_year', '2026', 'Edición 2026'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-MAT-PRI6'), 'format_size', 'carta', 'Pasta blanda 21 x 27 cm'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-MAT-PRI6'), 'sheet_count', '240', '240 páginas'),

  -- SNT-LIB-LEN-SEC2
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-LEN-SEC2'), 'education_level', 'secundaria', '2° de Secundaria'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-LEN-SEC2'), 'edition_year', '2026', 'Edición 2026'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-LEN-SEC2'), 'format_size', 'carta', 'Pasta blanda 21 x 27 cm'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-LEN-SEC2'), 'sheet_count', '264', '264 páginas'),

  -- SNT-DIC-ESP-2026
  ((SELECT id FROM products WHERE sku = 'SNT-DIC-ESP-2026'), 'education_level', 'primaria', 'Primaria y Secundaria'),
  ((SELECT id FROM products WHERE sku = 'SNT-DIC-ESP-2026'), 'edition_year', '2026', 'Edición 2026'),
  ((SELECT id FROM products WHERE sku = 'SNT-DIC-ESP-2026'), 'format_size', 'bolsillo', 'Formato 14 x 21 cm'),

  -- SNT-LIB-FIS-BACH
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-FIS-BACH'), 'education_level', 'universidad', 'Bachillerato / Preuniversitario'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-FIS-BACH'), 'edition_year', '2025', 'Edición 2025'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-FIS-BACH'), 'format_size', 'carta', 'Pasta blanda 21 x 27 cm'),
  ((SELECT id FROM products WHERE sku = 'SNT-LIB-FIS-BACH'), 'sheet_count', '380', '380 páginas'),

  -- FBC-LAP-HB2-12
  ((SELECT id FROM products WHERE sku = 'FBC-LAP-HB2-12'), 'lead_grade', 'HB', 'Graduación HB (#2)'),
  ((SELECT id FROM products WHERE sku = 'FBC-LAP-HB2-12'), 'education_level', 'general', 'Todos los niveles'),

  -- FBC-COL-24-ECO
  ((SELECT id FROM products WHERE sku = 'FBC-COL-24-ECO'), 'color_count', '24', '24 colores'),
  ((SELECT id FROM products WHERE sku = 'FBC-COL-24-ECO'), 'education_level', 'primaria', 'Primaria y Secundaria'),

  -- STD-BOL-AZU-10
  ((SELECT id FROM products WHERE sku = 'STD-BOL-AZU-10'), 'ink_color', 'azul', 'Tinta azul'),
  ((SELECT id FROM products WHERE sku = 'STD-BOL-AZU-10'), 'tip_size_mm', '1.0', 'Punta media 1.0 mm'),
  ((SELECT id FROM products WHERE sku = 'STD-BOL-AZU-10'), 'education_level', 'secundaria', 'Secundaria / Universidad'),

  -- FBC-TEM-06-ART
  ((SELECT id FROM products WHERE sku = 'FBC-TEM-06-ART'), 'color_count', '6', '6 frascos de 15 ml'),
  ((SELECT id FROM products WHERE sku = 'FBC-TEM-06-ART'), 'education_level', 'primaria', 'Preescolar y Primaria'),

  -- CAS-CAL-FX991
  ((SELECT id FROM products WHERE sku = 'CAS-CAL-FX991'), 'education_level', 'universidad', 'Bachillerato / Universidad'),
  ((SELECT id FROM products WHERE sku = 'CAS-CAL-FX991'), 'edition_year', '2025', 'Modelo ClassWiz'),

  -- STD-JGO-GEO-4P
  ((SELECT id FROM products WHERE sku = 'STD-JGO-GEO-4P'), 'format_size', '30cm', 'Regla 30 cm'),
  ((SELECT id FROM products WHERE sku = 'STD-JGO-GEO-4P'), 'education_level', 'secundaria', 'Primaria y Secundaria'),

  -- STD-COM-550-01
  ((SELECT id FROM products WHERE sku = 'STD-COM-550-01'), 'education_level', 'universidad', 'Dibujo Técnico / Universidad'),
  ((SELECT id FROM products WHERE sku = 'STD-COM-550-01'), 'format_size', 'precision', 'Ajuste micrométrico'),

  -- CAS-CAL-FX82MS
  ((SELECT id FROM products WHERE sku = 'CAS-CAL-FX82MS'), 'education_level', 'secundaria', 'Secundaria'),
  ((SELECT id FROM products WHERE sku = 'CAS-CAL-FX82MS'), 'edition_year', '2024', '2da Edición'),

  -- NRM-CMB-PRI-01
  ((SELECT id FROM products WHERE sku = 'NRM-CMB-PRI-01'), 'education_level', 'primaria', 'Primaria'),
  ((SELECT id FROM products WHERE sku = 'NRM-CMB-PRI-01'), 'ruling_type', 'cuadro_grande', 'Cuadro grande'),
  ((SELECT id FROM products WHERE sku = 'NRM-CMB-PRI-01'), 'edition_year', '2026', 'Temporada Escolar 2026'),

  -- SCR-CMB-UNI-01
  ((SELECT id FROM products WHERE sku = 'SCR-CMB-UNI-01'), 'education_level', 'universidad', 'Universidad / Ingeniería'),
  ((SELECT id FROM products WHERE sku = 'SCR-CMB-UNI-01'), 'ruling_type', 'cuadro_chico', 'Cuadro chico'),
  ((SELECT id FROM products WHERE sku = 'SCR-CMB-UNI-01'), 'edition_year', '2026', 'Temporada Escolar 2026')
ON DUPLICATE KEY UPDATE
  attribute_value = VALUES(attribute_value),
  display_label = VALUES(display_label);
