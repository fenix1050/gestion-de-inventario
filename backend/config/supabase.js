// =============================================================
// backend/config/supabase.js
// Cliente de Supabase con la SERVICE ROLE KEY.
//
// ¿Por qué service role key y no anon key?
// La service role key bypasea RLS y le da al backend
// acceso completo a la base de datos. Es seguro porque
// el backend valida permisos via middleware antes de ejecutar
// cualquier query. La anon key solo se usa en el frontend.
//
// Singleton: se crea una sola instancia y se reutiliza
// en todos los services — no crear clientes nuevos en cada query.
// =============================================================

const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    // El backend no maneja sesiones de usuario — eso es del frontend
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = supabase;
