// =============================================================
// backend/src/services/proveedores.service.js
// Lógica de negocio y queries a Supabase para proveedores.
// Solo lectura en esta fase — CRUD completo fuera de scope.
// =============================================================

const supabase = require('../../config/supabase');

/**
 * Retorna todos los proveedores activos ordenados por nombre.
 * Se usa para poblar selects en el formulario de ingresos.
 */
const getProveedores = async () => {
  const { data, error } = await supabase
    .from('proveedores')
    .select('id, nombre, ruc, contacto')
    .eq('activo', true)
    .order('nombre');

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { getProveedores };
