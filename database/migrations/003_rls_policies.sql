-- =============================================================
-- 003_rls_policies.sql
-- Row Level Security (RLS) — políticas de acceso por rol
-- Ejecutar DESPUÉS de 001 y 002
-- =============================================================
--
-- ¿Qué es RLS? Es el sistema de Supabase/Postgres que controla
-- qué filas puede ver o modificar cada usuario según su rol.
-- Es una segunda capa de seguridad además del middleware del backend.
-- Si alguien bypasea la API y llama directo a Supabase, RLS lo frena.
--
-- IMPORTANTE: el backend usa la SERVICE ROLE KEY, que bypasea RLS.
-- Esto es intencional — la API ya valida permisos via middleware.
-- RLS protege el acceso directo desde el cliente (anon/user key).
-- =============================================================


-- -------------------------------------------------------------
-- ACTIVAR RLS en todas las tablas
-- Sin esto, cualquier usuario con anon key puede leer todo
-- -------------------------------------------------------------

ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salidas       ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- FUNCIÓN AUXILIAR: obtener el rol del usuario actual
-- Lee el rol desde la tabla usuarios usando el JWT de Supabase
-- =============================================================

CREATE OR REPLACE FUNCTION get_mi_rol()
RETURNS text AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- =============================================================
-- POLÍTICAS — departamentos
-- Todos los roles autenticados pueden ver departamentos
-- Solo admin puede modificar
-- =============================================================

-- Lectura: cualquier usuario autenticado
CREATE POLICY "departamentos_select_autenticados"
  ON departamentos FOR SELECT
  TO authenticated
  USING (true);

-- Insertar: solo admin
CREATE POLICY "departamentos_insert_admin"
  ON departamentos FOR INSERT
  TO authenticated
  WITH CHECK (get_mi_rol() = 'admin');

-- Actualizar: solo admin
CREATE POLICY "departamentos_update_admin"
  ON departamentos FOR UPDATE
  TO authenticated
  USING (get_mi_rol() = 'admin')
  WITH CHECK (get_mi_rol() = 'admin');

-- Eliminar: solo admin
CREATE POLICY "departamentos_delete_admin"
  ON departamentos FOR DELETE
  TO authenticated
  USING (get_mi_rol() = 'admin');


-- =============================================================
-- POLÍTICAS — articulos
-- Todos pueden ver. Solo admin puede crear/editar/eliminar.
-- =============================================================

CREATE POLICY "articulos_select_autenticados"
  ON articulos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "articulos_insert_admin"
  ON articulos FOR INSERT
  TO authenticated
  WITH CHECK (get_mi_rol() = 'admin');

CREATE POLICY "articulos_update_admin"
  ON articulos FOR UPDATE
  TO authenticated
  USING (get_mi_rol() = 'admin')
  WITH CHECK (get_mi_rol() = 'admin');

CREATE POLICY "articulos_delete_admin"
  ON articulos FOR DELETE
  TO authenticated
  USING (get_mi_rol() = 'admin');


-- =============================================================
-- POLÍTICAS — proveedores
-- Todos pueden ver. Solo admin puede modificar.
-- =============================================================

CREATE POLICY "proveedores_select_autenticados"
  ON proveedores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "proveedores_insert_admin"
  ON proveedores FOR INSERT
  TO authenticated
  WITH CHECK (get_mi_rol() = 'admin');

CREATE POLICY "proveedores_update_admin"
  ON proveedores FOR UPDATE
  TO authenticated
  USING (get_mi_rol() = 'admin')
  WITH CHECK (get_mi_rol() = 'admin');

CREATE POLICY "proveedores_delete_admin"
  ON proveedores FOR DELETE
  TO authenticated
  USING (get_mi_rol() = 'admin');


-- =============================================================
-- POLÍTICAS — usuarios
-- Cada usuario ve su propio perfil.
-- Admin ve y gestiona todos.
-- =============================================================

-- Lectura: cada uno ve su fila, admin ve todas
CREATE POLICY "usuarios_select_propio_o_admin"
  ON usuarios FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR get_mi_rol() = 'admin'
  );

-- Insertar: solo admin (el registro de nuevos usuarios lo hace el admin)
CREATE POLICY "usuarios_insert_admin"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (get_mi_rol() = 'admin');

-- Actualizar: admin puede editar cualquiera; un usuario puede editar su propio perfil
CREATE POLICY "usuarios_update_propio_o_admin"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR get_mi_rol() = 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    OR get_mi_rol() = 'admin'
  );

-- Eliminar: solo admin
CREATE POLICY "usuarios_delete_admin"
  ON usuarios FOR DELETE
  TO authenticated
  USING (get_mi_rol() = 'admin');


-- =============================================================
-- POLÍTICAS — ingresos
-- Todos los autenticados pueden ver.
-- Admin y operador pueden registrar ingresos.
-- Nadie puede editar ni borrar ingresos (son registros históricos).
-- =============================================================

CREATE POLICY "ingresos_select_autenticados"
  ON ingresos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ingresos_insert_admin_operador"
  ON ingresos FOR INSERT
  TO authenticated
  WITH CHECK (get_mi_rol() IN ('admin', 'operador'));

-- No se crean políticas de UPDATE ni DELETE en ingresos
-- Los movimientos son inmutables para mantener integridad del historial


-- =============================================================
-- POLÍTICAS — salidas
-- Todos los autenticados pueden ver.
-- Admin y operador pueden registrar salidas.
-- Nadie puede editar ni borrar salidas (registros históricos).
-- =============================================================

CREATE POLICY "salidas_select_autenticados"
  ON salidas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "salidas_insert_admin_operador"
  ON salidas FOR INSERT
  TO authenticated
  WITH CHECK (get_mi_rol() IN ('admin', 'operador'));

-- No se crean políticas de UPDATE ni DELETE en salidas
