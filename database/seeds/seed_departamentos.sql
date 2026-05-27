-- =============================================================
-- seed_departamentos.sql
-- Los 12 departamentos internos de Aseguradora Tajy
-- Ejecutar DESPUÉS de las 3 migraciones
-- =============================================================

INSERT INTO departamentos (nombre, codigo, centro_costo) VALUES
  ('Siniestros',              'SINIESTROS',       'CC-101'),
  ('Atención al Cliente',     'ATENCION_CLIENTE',  'CC-102'),
  ('Comercial y Ventas',      'COMERCIAL',         'CC-103'),
  ('Administración',          'ADMINISTRACION',    'CC-104'),
  ('Contabilidad',            'CONTABILIDAD',      'CC-105'),
  ('Recursos Humanos',        'RRHH',              'CC-106'),
  ('Tecnología',              'TECNOLOGIA',        'CC-107'),
  ('Legal',                   'LEGAL',             'CC-108'),
  ('Gerencia General',        'GERENCIA',          'CC-109'),
  ('Marketing',               'MARKETING',         'CC-110'),
  ('Depósito / Logística',    'DEPOSITO',          'CC-111'),
  ('Auditoría Interna',       'AUDITORIA',         'CC-112')
ON CONFLICT (codigo) DO NOTHING;
