// =============================================================
// backend/src/models/historial.model.js
// Schema Zod para validar los query params de GET /api/historial
// =============================================================

const { z } = require('zod');

const HistorialQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().positive().default(1)),

  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 20))
    .pipe(z.number().int().positive().max(100).default(20)),

  tipo: z.enum(['ingreso', 'salida']).optional(),

  articulo_id: z.string().uuid().optional(),

  fecha_desde: z.string().optional(),

  fecha_hasta: z.string().optional(),
});

module.exports = { HistorialQuerySchema };
