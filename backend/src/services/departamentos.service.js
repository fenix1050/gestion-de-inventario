// =============================================================
// backend/src/services/departamentos.service.js
// Lógica de negocio y queries a Supabase para departamentos.
// Solo lectura en esta fase — CRUD completo fuera de scope.
// =============================================================

const supabase = require('../../config/supabase');

/**
 * Retorna todos los departamentos ordenados por nombre.
 * Se usa para poblar selects en el formulario de salidas
 * y para resolver el centro_costo antes de insertar una salida.
 */
const getDepartamentos = async () => {
  const { data, error } = await supabase
    .from('departamentos')
    .select('id, nombre, centro_costo')
    .order('nombre');

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { getDepartamentos };
