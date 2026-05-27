// Genera src/config.js con las variables de entorno de Netlify.
// Se ejecuta como build command antes de publicar el sitio.
const fs = require('fs');
const path = require('path');

const { API_URL, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!API_URL || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[generate-config] Faltan variables de entorno:');
  if (!API_URL)          console.error('  - API_URL');
  if (!SUPABASE_URL)     console.error('  - SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) console.error('  - SUPABASE_ANON_KEY');
  process.exit(1);
}

const content = `export const CONFIG = {
  API_URL: '${API_URL}',
  SUPABASE_URL: '${SUPABASE_URL}',
  SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
};
`;

const outputPath = path.join(__dirname, '..', 'src', 'config.js');
fs.writeFileSync(outputPath, content, 'utf8');
console.log('[generate-config] src/config.js generado correctamente.');
