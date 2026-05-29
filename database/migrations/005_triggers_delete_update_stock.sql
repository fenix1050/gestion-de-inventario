-- =============================================================
-- Migración 005: Triggers para DELETE y UPDATE en ingresos/salidas
-- Permite editar y eliminar movimientos recalculando stock automáticamente.
-- Aplicar en Supabase SQL Editor antes de deployar los cambios de backend.
-- =============================================================

-- -------------------------------------------------------
-- INGRESOS — DELETE
-- Al eliminar un ingreso, resta la cantidad del stock.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_ingreso_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE articulos
     SET stock_actual = stock_actual - OLD.cantidad
   WHERE id = OLD.articulo_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ingreso_delete ON ingresos;
CREATE TRIGGER trigger_ingreso_delete
  AFTER DELETE ON ingresos
  FOR EACH ROW EXECUTE FUNCTION fn_ingreso_delete();

-- -------------------------------------------------------
-- INGRESOS — UPDATE
-- Al editar un ingreso, aplica la diferencia de cantidad.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_ingreso_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE articulos
     SET stock_actual = stock_actual - OLD.cantidad + NEW.cantidad
   WHERE id = OLD.articulo_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ingreso_update ON ingresos;
CREATE TRIGGER trigger_ingreso_update
  AFTER UPDATE OF cantidad ON ingresos
  FOR EACH ROW EXECUTE FUNCTION fn_ingreso_update();

-- -------------------------------------------------------
-- SALIDAS — DELETE
-- Al eliminar una salida, devuelve la cantidad al stock.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_salida_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE articulos
     SET stock_actual = stock_actual + OLD.cantidad
   WHERE id = OLD.articulo_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_salida_delete ON salidas;
CREATE TRIGGER trigger_salida_delete
  AFTER DELETE ON salidas
  FOR EACH ROW EXECUTE FUNCTION fn_salida_delete();

-- -------------------------------------------------------
-- SALIDAS — UPDATE
-- Al editar una salida, aplica la diferencia de cantidad.
-- Rechaza si el stock resultante sería negativo.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_salida_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_stock_actual INTEGER;
  v_diferencia   INTEGER;
BEGIN
  v_diferencia := NEW.cantidad - OLD.cantidad;

  -- Solo recalcula si cambió la cantidad
  IF v_diferencia = 0 THEN
    RETURN NEW;
  END IF;

  SELECT stock_actual INTO v_stock_actual
    FROM articulos WHERE id = OLD.articulo_id;

  -- Si la nueva cantidad es mayor, verificar que haya stock suficiente
  IF v_diferencia > 0 AND v_stock_actual < v_diferencia THEN
    RAISE EXCEPTION 'Stock insuficiente para actualizar la salida. Stock disponible: %', v_stock_actual
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE articulos
     SET stock_actual = stock_actual - v_diferencia
   WHERE id = OLD.articulo_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_salida_update ON salidas;
CREATE TRIGGER trigger_salida_update
  BEFORE UPDATE OF cantidad ON salidas
  FOR EACH ROW EXECUTE FUNCTION fn_salida_update();
