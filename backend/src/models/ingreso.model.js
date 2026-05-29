// =============================================================
// backend/src/models/ingreso.model.js
// Schema Zod para validación de ingresos al depósito.
//
// .strict() rechaza campos no declarados — misma política que articulo.model.js
// stock_actual NO se incluye — lo maneja el trigger trigger_ingreso_stock
// =============================================================

const { z } = require('zod');

const ingresoCreateSchema = z.object({
  articulo_id:     z.string().uuid('articulo_id debe ser un UUID válido'),
  proveedor_id:    z.string().uuid('proveedor_id debe ser un UUID válido').optional(),
  proveedor_nombre: z.string().trim().max(100, 'máximo 100 caracteres').optional(),
  cantidad:        z.number().int('debe ser entero').positive('debe ser mayor a 0'),
  precio_unitario: z.number().min(0, 'no puede ser negativo').optional(),
  referencia:      z.string().trim().max(50, 'máximo 50 caracteres').optional(),
  fecha:           z.string().optional(),
  observaciones:   z.string().trim().max(500, 'máximo 500 caracteres').optional(),
}).strict();

const ingresoUpdateSchema = z.object({
  proveedor_id:     z.string().uuid('proveedor_id debe ser un UUID válido').optional(),
  proveedor_nombre: z.string().trim().max(100, 'máximo 100 caracteres').optional(),
  cantidad:         z.number().int('debe ser entero').positive('debe ser mayor a 0').optional(),
  precio_unitario:  z.number().min(0, 'no puede ser negativo').optional(),
  referencia:       z.string().trim().max(50, 'máximo 50 caracteres').optional(),
  observaciones:    z.string().trim().max(500, 'máximo 500 caracteres').optional(),
}).strict();

module.exports = { ingresoCreateSchema, ingresoUpdateSchema };
