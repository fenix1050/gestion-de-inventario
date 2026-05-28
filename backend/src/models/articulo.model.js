// =============================================================
// backend/src/models/articulo.model.js
// Schemas Zod para validación de artículos.
//
// Regla clave: NO incluir stock_actual ni activo.
// - stock_actual lo controlan triggers de Postgres exclusivamente.
// - activo lo controla el endpoint DELETE (soft-delete), no el cliente.
//
// .strict() rechaza cualquier campo extra con status 400, incluyendo
// intentos de inyectar stock_actual o activo desde el cliente.
// =============================================================

const { z } = require('zod');

const crearArticuloSchema = z.object({
  codigo:          z.string().trim().min(1, 'requerido').max(20, 'máximo 20 caracteres'),
  nombre:          z.string().trim().min(2, 'mínimo 2 caracteres').max(120, 'máximo 120 caracteres'),
  descripcion:     z.string().trim().max(500, 'máximo 500 caracteres').nullable().optional(),
  categoria:       z.string().trim().max(50, 'máximo 50 caracteres').optional(),
  precio_unitario: z.number().positive('debe ser mayor a 0'),
  stock_minimo:    z.number().int('debe ser entero').min(0, 'no puede ser negativo'),
  unidad_medida:   z.string().trim().min(1, 'requerida').max(30, 'máximo 30 caracteres'),
  // stock_inicial: campo separado para el ingreso inicial. NO se escribe directo en articulos.
  // Si > 0, el service crea un registro en `ingresos` → el trigger de Postgres suma al stock_actual.
  stock_inicial:   z.number().int('debe ser entero').min(0, 'no puede ser negativo').optional().default(0),
}).strict(); // rechaza campos extra — defensa contra inyección de stock_actual/activo

// Para PUT: todos los campos son opcionales (solo se actualizan los enviados)
// Hereda .strict() del schema padre
const actualizarArticuloSchema = crearArticuloSchema.partial();

module.exports = { crearArticuloSchema, actualizarArticuloSchema };
