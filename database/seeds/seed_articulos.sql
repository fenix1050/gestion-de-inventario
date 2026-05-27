-- =============================================================
-- seed_articulos.sql
-- Artículos de prueba para el catálogo de insumos
-- Ejecutar DESPUÉS de seed_departamentos.sql
-- =============================================================
--
-- Estos son datos de prueba para desarrollo.
-- En producción se cargan los artículos reales desde la UI.
-- =============================================================

INSERT INTO articulos (codigo, nombre, descripcion, categoria, precio_unitario, stock_actual, stock_minimo, unidad_medida) VALUES
  -- Papelería
  ('ART-001', 'Resma papel A4 75g',        'Papel bond blanco 75g/m², 500 hojas',        'papeleria',  45000.00, 20, 5,  'resma'),
  ('ART-002', 'Bolígrafo azul BIC',         'Bolígrafo punta media, tinta azul',           'papeleria',   3500.00, 50, 10, 'unidad'),
  ('ART-003', 'Bolígrafo negro BIC',         'Bolígrafo punta media, tinta negra',          'papeleria',   3500.00, 50, 10, 'unidad'),
  ('ART-004', 'Carpeta A4 con gancho',       'Carpeta plástica con mecanismo de palanca',   'papeleria',  12000.00, 30, 5,  'unidad'),
  ('ART-005', 'Sobre carta blanco',          'Sobre bond blanco 110mm x 220mm',             'papeleria',   1500.00, 100, 20, 'unidad'),
  ('ART-006', 'Marcador permanente negro',   'Marcador Sharpie punta fina',                 'papeleria',   8000.00, 20, 5,  'unidad'),
  ('ART-007', 'Post-it 76x76mm',            'Notas adhesivas amarillas, 100 hojas',         'papeleria',  15000.00, 15, 3,  'paquete'),

  -- Ofimatica / escritorio
  ('ART-008', 'Cinta adhesiva transparente', 'Rollo 19mm x 33m',                            'ofetica',    5000.00, 20, 5,  'unidad'),
  ('ART-009', 'Tijera de oficina',           'Tijera inoxidable 21cm',                       'ofetica',   18000.00, 10, 2,  'unidad'),
  ('ART-010', 'Engrapadora de escritorio',   'Engrapadora para 20 hojas, usa grampa 26/6',   'ofetica',   45000.00, 5,  1,  'unidad'),
  ('ART-011', 'Grampa 26/6 x 1000',         'Caja de 1000 grampas 26/6',                    'ofetica',    8500.00, 25, 5,  'caja'),
  ('ART-012', 'Perforadora 2 agujeros',      'Perforadora metálica para 30 hojas',           'ofetica',   55000.00, 4,  1,  'unidad'),

  -- Tóner / impresión
  ('ART-013', 'Tóner HP 85A Negro',          'Cartucho tóner LaserJet, 1600 páginas',        'toner',    280000.00, 4,  1,  'unidad'),
  ('ART-014', 'Tóner Samsung MLT-D101S',     'Cartucho tóner, 1500 páginas',                 'toner',    240000.00, 3,  1,  'unidad'),

  -- Limpieza
  ('ART-015', 'Alcohol en gel 500ml',        'Gel antibacterial para manos',                 'limpieza',  18000.00, 10, 3,  'unidad'),
  ('ART-016', 'Papel higiénico x12',         'Pack 12 rollos doble hoja',                    'limpieza',  35000.00, 8,  2,  'paquete'),
  ('ART-017', 'Jabón líquido 500ml',         'Jabón líquido para manos',                     'limpieza',  22000.00, 6,  2,  'unidad')

ON CONFLICT (codigo) DO NOTHING;
