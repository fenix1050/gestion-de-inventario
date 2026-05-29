// =============================================================
// backend/src/models/usuario.model.js
// Schemas Zod para validación de usuarios del sistema.
// =============================================================

const { z } = require('zod');

const crearUsuarioSchema = z.object({
  email:           z.string().email('Email inválido'),
  password:        z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre_completo: z.string().min(2, 'mínimo 2 caracteres').max(120, 'máximo 120 caracteres'),
  rol:             z.enum(['admin', 'operador', 'consultor'], { errorMap: () => ({ message: 'Rol inválido. Debe ser admin, operador o consultor' }) }),
  departamento_id: z.string().uuid('departamento_id debe ser un UUID válido').nullable().optional(),
  cedula:          z.string().max(20, 'máximo 20 caracteres').nullable().optional(),
  telefono:        z.string().max(30, 'máximo 30 caracteres').nullable().optional(),
});

const actualizarUsuarioSchema = z.object({
  nombre_completo: z.string().min(2, 'mínimo 2 caracteres').max(120, 'máximo 120 caracteres').optional(),
  rol:             z.enum(['admin', 'operador', 'consultor'], { errorMap: () => ({ message: 'Rol inválido. Debe ser admin, operador o consultor' }) }).optional(),
  departamento_id: z.string().uuid('departamento_id debe ser un UUID válido').nullable().optional(),
  cedula:          z.string().max(20, 'máximo 20 caracteres').nullable().optional(),
  telefono:        z.string().max(30, 'máximo 30 caracteres').nullable().optional(),
  activo:          z.boolean().optional(),
}).refine(obj => Object.keys(obj).length > 0, 'Debe enviar al menos un campo para actualizar');

module.exports = { crearUsuarioSchema, actualizarUsuarioSchema };
