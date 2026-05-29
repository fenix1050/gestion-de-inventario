// =============================================================
// backend/src/models/salida.model.js
// Schema Zod para validación de salidas del depósito.
//
// .strict() rechaza campos no declarados — misma política que ingreso.model.js
// centro_costo NO se incluye — lo resuelve el service desde el departamento (snapshot)
// stock_actual NO se incluye — lo maneja el trigger trigger_salida_stock
// =============================================================

const { z } = require('zod');

const salidaCreateSchema = z.object({
  articulo_id:     z.string().uuid('articulo_id debe ser un UUID válido'),
  cantidad:        z.number().int('debe ser entero').positive('debe ser mayor a 0'),
  departamento_id: z.string().uuid('departamento_id debe ser un UUID válido'),
  colaborador_id:  z.string().uuid('colaborador_id debe ser un UUID válido'),
  observaciones:   z.string().trim().max(500, 'máximo 500 caracteres').optional(),
}).strict();

module.exports = { salidaCreateSchema };
