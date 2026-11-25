-- Seed 001: Study bookstore categories and brands (idempotent)

SET NAMES utf8mb4;

INSERT INTO categories (parent_id, name, slug, description, is_active)
VALUES
  (NULL, 'Cuadernos y Papel', 'cuadernos-y-papel', 'Cuadernos universitarios, escolares, blocs de dibujo y resmas de papel bond.', 1),
  (NULL, 'Libros y Textos', 'libros-y-textos', 'Textos escolares, libros de consulta, diccionarios y guías de estudio por nivel.', 1),
  (NULL, 'Escritura y Arte', 'escritura-y-arte', 'Lápices de grafito, bolígrafos, marcadores, colores, témperas y pinceles.', 1),
  (NULL, 'Geometría y Cálculo', 'geometria-y-calculo', 'Juegos geométricos, compases de precisión, reglas y calculadoras científicas.', 1),
  (NULL, 'Combos Escolares', 'combos-escolares', 'Paquetes armados por nivel educativo listos para el ciclo escolar.', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active);

INSERT INTO brands (name, slug, is_active)
VALUES
  ('Norma', 'norma', 1),
  ('Faber-Castell', 'faber-castell', 1),
  ('Staedtler', 'staedtler', 1),
  ('Casio', 'casio', 1),
  ('Scribe', 'scribe', 1),
  ('Santillana', 'santillana', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  is_active = VALUES(is_active);
