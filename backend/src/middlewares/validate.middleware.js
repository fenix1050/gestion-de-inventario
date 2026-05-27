// =============================================================
// backend/src/middlewares/validate.middleware.js
// Middleware factory para validar req.body con schemas Zod.
//
// Uso: router.post('/', validate(miSchema), controller.create)
//
// Si el body no pasa la validación, responde 400 con el primer
// error en español y NO llama a next().
// Si pasa, reemplaza req.body con result.data (limpio, sin campos
// extra) para que el controller nunca vea campos inyectados.
// =============================================================

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Solo mostramos el primer issue — UX simple, el cliente lo muestra en Toast
    const primero = result.error.issues[0];
    const campo = primero.path.join('.') || 'campo';
    const msg = `${campo}: ${primero.message}`;
    return res.status(400).json({ success: false, error: msg });
  }

  // Reemplazar req.body con datos parseados: limpios, coercionados, sin campos extra.
  // Esto blinda contra inyección de campos como stock_actual o activo.
  req.body = result.data;
  next();
};

module.exports = { validate };
