// =============================================================
// backend/src/services/usuarios.service.js
// Lógica de negocio y queries a Supabase para usuarios del sistema.
//
// Este service interactúa con DOS superficies de Supabase:
//   - supabase.auth.admin.*  → auth.users (gestión de identidad)
//   - supabase.from('usuarios') → public.usuarios (perfil y rol)
//
// Invariante: todo auth.user creado por esta app DEBE tener fila en
// public.usuarios con el mismo UUID. Si el INSERT falla, se hace rollback
// con deleteUser para no dejar auth users huérfanos.
// =============================================================

const supabase = require('../../config/supabase');
const { createDomainError } = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * Lista usuarios del sistema con embed del departamento.
 *
 * @param {Object} [opciones]
 * @param {boolean} [opciones.incluirInactivos=false] - si false, solo usuarios activos
 * @returns {Array} lista de usuarios
 */
const getUsuarios = async ({ filtroActivo = null } = {}) => {
  // filtroActivo: true  → solo activos
  //               false → solo inactivos
  //               null  → todos (sin filtro)
  let query = supabase
    .from('usuarios')
    .select('id, email, nombre_completo, rol, departamento_id, activo, cedula, telefono, departamento:departamentos(id, nombre)')
    .order('nombre_completo');

  if (filtroActivo === true)  query = query.eq('activo', true);
  if (filtroActivo === false) query = query.eq('activo', false);

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Crea un usuario nuevo: primero en auth.users, luego en public.usuarios.
 * Si el INSERT en public.usuarios falla, elimina el auth user como rollback.
 *
 * @param {Object} payload - campos validados por crearUsuarioSchema
 * @returns {Object} fila creada en public.usuarios
 */
const crearUsuario = async (payload) => {
  // Paso 1: crear en auth.users vía Admin API
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email:         payload.email,
    password:      payload.password,
    email_confirm: true,
  });

  if (authErr) {
    // Traducir errores conocidos de Supabase Auth a mensajes en español
    if (/already registered|already exists/i.test(authErr.message)) {
      throw createDomainError('EMAIL_DUPLICADO', 'Ya existe un usuario registrado con ese email.');
    }
    if (/password/i.test(authErr.message)) {
      throw createDomainError('PASSWORD_DEBIL', 'La contraseña no cumple los requisitos mínimos de seguridad.');
    }
    throw new Error(authErr.message);
  }

  const authUserId = authData.user.id;

  // Paso 2: INSERT en public.usuarios con el UUID devuelto por Auth
  const { data: usuario, error: insertErr } = await supabase
    .from('usuarios')
    .insert({
      id:              authUserId,
      email:           payload.email,
      nombre_completo: payload.nombre_completo,
      rol:             payload.rol,
      departamento_id: payload.departamento_id ?? null,
      cedula:          payload.cedula ?? null,
      telefono:        payload.telefono ?? null,
      activo:          true,
    })
    .select('id, email, nombre_completo, rol, departamento_id, activo')
    .single();

  if (insertErr) {
    // Rollback: eliminar el auth user para no dejar huérfanos
    const { error: delErr } = await supabase.auth.admin.deleteUser(authUserId);

    if (delErr) {
      // Rollback también falló — loguear UUID para limpieza manual
      logger.error({ authUserId, delErr: delErr.message }, 'Rollback de createUser falló — auth user huérfano. Requiere limpieza manual.');
      throw new Error('No se pudo crear el usuario y el rollback falló. Contacte al administrador.');
    }

    throw new Error('No se pudo crear el usuario: ' + insertErr.message);
  }

  return usuario;
};

/**
 * Desactiva un usuario: marca activo=false en la tabla y aplica ban en Auth.
 * Idempotente — si ya estaba inactivo, no produce error.
 *
 * @param {string} id - UUID del usuario
 */
const desactivarUsuario = async (id) => {
  // Orden: tabla propia primero, ban en Auth después
  const { data: filas, error: updErr } = await supabase
    .from('usuarios')
    .update({ activo: false })
    .eq('id', id)
    .select('id');

  if (updErr) throw new Error(updErr.message);
  if (!filas || filas.length === 0) {
    throw createDomainError('NOT_FOUND', 'Usuario no encontrado.');
  }

  const { error: banErr } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: '876600h', // ~100 años — equivale a baneo permanente
  });

  if (banErr) {
    // El usuario quedó marcado inactivo en la tabla, pero el ban de Auth falló.
    // El middleware requireRol chequea activo en la tabla, así que igualmente
    // será rechazado. Pero logueamos para visibilidad.
    logger.warn({ id, banErr: banErr.message }, 'Usuario marcado inactivo pero ban en Auth no se pudo aplicar');
  }
};

/**
 * Reactiva un usuario: marca activo=true en la tabla y remueve el ban en Auth.
 *
 * @param {string} id - UUID del usuario
 */
const reactivarUsuario = async (id) => {
  const { error: updErr } = await supabase
    .from('usuarios')
    .update({ activo: true })
    .eq('id', id);

  if (updErr) throw new Error(updErr.message);

  const { error: unbanErr } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: 'none',
  });

  if (unbanErr) {
    logger.warn({ id, unbanErr: unbanErr.message }, 'Usuario reactivado en tabla pero no se pudo remover ban en Auth');
  }
};

/**
 * Actualiza datos de un usuario existente.
 * Si el payload incluye `activo`, delega a desactivarUsuario / reactivarUsuario.
 *
 * @param {string} id - UUID del usuario
 * @param {Object} payload - campos validados por actualizarUsuarioSchema
 * @returns {Object} fila actualizada
 */
const actualizarUsuario = async (id, payload) => {
  // Manejar cambio de estado activo/inactivo
  if (payload.activo === true)  await reactivarUsuario(id);
  if (payload.activo === false) await desactivarUsuario(id);

  // Campos editables (excluir activo — ya fue manejado arriba)
  const camposEditables = {
    nombre_completo: payload.nombre_completo,
    rol:             payload.rol,
    departamento_id: payload.departamento_id,
    cedula:          payload.cedula,
    telefono:        payload.telefono,
  };

  // Remover undefined para no sobreescribir con null accidentalmente
  const update = Object.fromEntries(
    Object.entries(camposEditables).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(update).length === 0) {
    // Solo cambió activo — devolver fila actual sin hacer UPDATE innecesario
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre_completo, rol, departamento_id, activo')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(update)
    .eq('id', id)
    .select('id, email, nombre_completo, rol, departamento_id, activo')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw createDomainError('NOT_FOUND', 'Usuario no encontrado.');
    }
    throw new Error(error.message);
  }

  return data;
};

module.exports = { getUsuarios, crearUsuario, actualizarUsuario, desactivarUsuario, reactivarUsuario };
