-- =============================================================
-- 001_initial_schema.sql
-- Esquema inicial del sistema de gestión - Aseguradora Tajy
-- Módulo: Inventario de insumos internos
-- Ejecutar en: Supabase SQL Editor
-- Orden: este archivo primero, luego 002 y 003
-- =============================================================


-- -------------------------------------------------------------
-- EXTENSIONES
-- -------------------------------------------------------------

-- uuid_generate_v4() para generar UUIDs en columnas PK
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- -------------------------------------------------------------
-- TABLA: departamentos
-- Los 12 departamentos internos de Tajy con su centro de costo
-- Se crea antes que usuarios y salidas porque son referenciados
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS departamentos (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       text NOT NULL,
  codigo       text UNIQUE,                -- Ej: "SINIESTROS", "ATENCION_CLIENTE"
  centro_costo text,                       -- Ej: CC-101, CC-201
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índice para búsqueda por nombre (frecuente en selects del frontend)
CREATE INDEX IF NOT EXISTS idx_departamentos_nombre ON departamentos (nombre);


-- -------------------------------------------------------------
-- TABLA: articulos
-- Catálogo de insumos (papelería, ofimatica, etc.)
-- El stock se actualiza SOLO via triggers, nunca desde el backend
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS articulos (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo          text UNIQUE NOT NULL,    -- Ej: ART-001, ART-002
  nombre          text NOT NULL,
  descripcion     text,
  categoria       text NOT NULL
                  CHECK (categoria IN ('papeleria', 'ofetica', 'toner', 'limpieza', 'otros')),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  stock_actual    integer NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo    integer NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  unidad_medida   text NOT NULL
                  CHECK (unidad_medida IN ('unidad', 'caja', 'paquete', 'litro', 'kg', 'resma')),
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para los filtros más comunes del listado
CREATE INDEX IF NOT EXISTS idx_articulos_categoria  ON articulos (categoria);
CREATE INDEX IF NOT EXISTS idx_articulos_activo     ON articulos (activo);
CREATE INDEX IF NOT EXISTS idx_articulos_nombre     ON articulos (nombre);
-- Para la alerta de stock bajo: artículos donde stock_actual <= stock_minimo
CREATE INDEX IF NOT EXISTS idx_articulos_stock      ON articulos (stock_actual, stock_minimo);


-- -------------------------------------------------------------
-- TABLA: proveedores
-- Proveedores de insumos de la aseguradora
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS proveedores (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     text NOT NULL,
  ruc        text,                         -- RUC paraguayo (opcional)
  telefono   text,
  email      text,
  contacto   text,                         -- Nombre de la persona de contacto
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores (nombre);


-- -------------------------------------------------------------
-- TABLA: usuarios
-- Extensión de auth.users de Supabase
-- Cada usuario autenticado tiene un perfil aquí con rol y depto
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuarios (
  id              uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  cedula          text,                    -- Cédula de identidad paraguaya
  telefono        text,
  departamento_id uuid REFERENCES departamentos (id) ON DELETE SET NULL,
  rol             text NOT NULL DEFAULT 'consultor'
                  CHECK (rol IN ('admin', 'operador', 'consultor')),
  activo          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol            ON usuarios (rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_departamento   ON usuarios (departamento_id);


-- -------------------------------------------------------------
-- TABLA: ingresos
-- Entradas de mercancía al depósito
-- El trigger trigger_ingreso_stock (002) suma al stock_actual
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ingresos (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  articulo_id     uuid NOT NULL REFERENCES articulos (id) ON DELETE RESTRICT,
  cantidad        integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  proveedor_id    uuid REFERENCES proveedores (id) ON DELETE SET NULL,
  referencia      text,                    -- Número de factura o remito
  observaciones   text,
  usuario_id      uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para los filtros del historial y reportes
CREATE INDEX IF NOT EXISTS idx_ingresos_articulo   ON ingresos (articulo_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_proveedor  ON ingresos (proveedor_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha      ON ingresos (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ingresos_usuario    ON ingresos (usuario_id);


-- -------------------------------------------------------------
-- TABLA: salidas
-- Entregas de insumos a colaboradores
-- El trigger trigger_salida_stock (002) valida y resta stock
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS salidas (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  articulo_id     uuid NOT NULL REFERENCES articulos (id) ON DELETE RESTRICT,
  cantidad        integer NOT NULL CHECK (cantidad > 0),
  colaborador_id  uuid REFERENCES auth.users (id) ON DELETE SET NULL,  -- A quién se entrega
  departamento_id uuid NOT NULL REFERENCES departamentos (id) ON DELETE RESTRICT,
  centro_costo    text,                    -- Se copia del depto al registrar (dato histórico)
  motivo          text
                  CHECK (motivo IN ('uso_operativo', 'reposicion', 'solicitud_especial', 'otro')),
  observaciones   text,
  usuario_id      uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,  -- Quién registra
  fecha           date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para los filtros del historial y reportes por departamento
CREATE INDEX IF NOT EXISTS idx_salidas_articulo      ON salidas (articulo_id);
CREATE INDEX IF NOT EXISTS idx_salidas_departamento  ON salidas (departamento_id);
CREATE INDEX IF NOT EXISTS idx_salidas_colaborador   ON salidas (colaborador_id);
CREATE INDEX IF NOT EXISTS idx_salidas_fecha         ON salidas (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_salidas_usuario       ON salidas (usuario_id);


-- -------------------------------------------------------------
-- FUNCIÓN: updated_at automático
-- Actualiza el campo updated_at en articulos cada vez que
-- se modifica una fila. Se llama desde un trigger.
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_articulos_updated_at
  BEFORE UPDATE ON articulos
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();


-- -------------------------------------------------------------
-- VISTA: historial_movimientos
-- Une ingresos y salidas en una vista unificada para el
-- endpoint GET /api/historial. El backend no necesita hacer
-- UNION manual, simplemente consulta esta vista.
-- -------------------------------------------------------------

CREATE OR REPLACE VIEW historial_movimientos AS
  SELECT
    i.id,
    'ingreso'                    AS tipo,
    i.fecha,
    a.codigo                     AS articulo_codigo,
    a.nombre                     AS articulo_nombre,
    a.categoria                  AS articulo_categoria,
    i.cantidad,
    i.precio_unitario,
    (i.cantidad * i.precio_unitario) AS total_gs,
    p.nombre                     AS proveedor_nombre,
    NULL::uuid                   AS departamento_id,
    NULL::text                   AS departamento_nombre,
    NULL::text                   AS centro_costo,
    NULL::text                   AS motivo,
    i.referencia,
    i.observaciones,
    u.nombre_completo            AS registrado_por,
    i.created_at
  FROM ingresos i
  JOIN articulos    a ON a.id = i.articulo_id
  LEFT JOIN proveedores  p ON p.id = i.proveedor_id
  LEFT JOIN usuarios     u ON u.id = i.usuario_id

UNION ALL

  SELECT
    s.id,
    'salida'                     AS tipo,
    s.fecha,
    a.codigo                     AS articulo_codigo,
    a.nombre                     AS articulo_nombre,
    a.categoria                  AS articulo_categoria,
    s.cantidad,
    a.precio_unitario,
    (s.cantidad * a.precio_unitario) AS total_gs,
    NULL::text                   AS proveedor_nombre,
    d.id                         AS departamento_id,
    d.nombre                     AS departamento_nombre,
    s.centro_costo,
    s.motivo,
    NULL::text                   AS referencia,
    s.observaciones,
    u.nombre_completo            AS registrado_por,
    s.created_at
  FROM salidas s
  JOIN articulos      a ON a.id = s.articulo_id
  JOIN departamentos  d ON d.id = s.departamento_id
  LEFT JOIN usuarios  u ON u.id = s.usuario_id;
