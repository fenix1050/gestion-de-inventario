-- =============================================================
-- 002_triggers_stock.sql
-- Triggers de actualización automática de stock
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- =============================================================
--
-- IMPORTANTE: el stock de articulos.stock_actual se actualiza
-- EXCLUSIVAMENTE acá, mediante triggers de Postgres.
-- El backend NUNCA modifica stock_actual directamente.
-- Esto garantiza consistencia aunque haya múltiples
-- usuarios registrando movimientos al mismo tiempo.
-- =============================================================


-- -------------------------------------------------------------
-- TRIGGER 1: trigger_ingreso_stock
-- Evento: AFTER INSERT ON ingresos
-- Qué hace: suma la cantidad ingresada al stock_actual
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION actualizar_stock_ingreso()
RETURNS TRIGGER AS $$
BEGIN
  -- Sumamos la cantidad del ingreso al stock actual del artículo
  UPDATE articulos
  SET
    stock_actual = stock_actual + NEW.cantidad,
    updated_at   = now()
  WHERE id = NEW.articulo_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Borramos el trigger si ya existe para poder re-ejecutar el script
DROP TRIGGER IF EXISTS trigger_ingreso_stock ON ingresos;

CREATE TRIGGER trigger_ingreso_stock
  AFTER INSERT ON ingresos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock_ingreso();


-- -------------------------------------------------------------
-- TRIGGER 2: trigger_salida_stock
-- Evento: BEFORE INSERT ON salidas
-- Qué hace:
--   1. Lee el stock_actual del artículo
--   2. Si es menor a la cantidad solicitada → lanza excepción
--      (el INSERT se cancela, el backend recibe un error 400)
--   3. Si hay stock suficiente → descuenta la cantidad
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION actualizar_stock_salida()
RETURNS TRIGGER AS $$
DECLARE
  stock_disponible INTEGER;
BEGIN
  -- Leemos el stock con FOR UPDATE para evitar race conditions
  -- si dos operadores registran salidas del mismo artículo al mismo tiempo
  SELECT stock_actual
  INTO stock_disponible
  FROM articulos
  WHERE id = NEW.articulo_id
  FOR UPDATE;

  -- Validación de stock suficiente
  IF stock_disponible < NEW.cantidad THEN
    RAISE EXCEPTION
      'Stock insuficiente para el artículo. Disponible: %, solicitado: %',
      stock_disponible,
      NEW.cantidad
    USING ERRCODE = 'P0001';  -- error de aplicación (el backend lo captura como 400)
  END IF;

  -- Descontamos el stock
  UPDATE articulos
  SET
    stock_actual = stock_actual - NEW.cantidad,
    updated_at   = now()
  WHERE id = NEW.articulo_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_salida_stock ON salidas;

CREATE TRIGGER trigger_salida_stock
  BEFORE INSERT ON salidas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock_salida();
