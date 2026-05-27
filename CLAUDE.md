# CLAUDE.md — Sistema de Gestión Tajy

Este archivo provee contexto completo a Claude Code al trabajar en este repositorio.
Leerlo siempre antes de generar código.

---

## Contexto del proyecto

Sistema interno para **Aseguradora Tajy** (empresa de seguros en Paraguay). Dos módulos:

1. **Inventario de insumos internos** (papelería, ofética) — módulo actual ← empezamos acá
2. **Flota vehicular** con solicitudes de uso — módulo siguiente

Desarrollado por Kevin Ruiz Díaz, Tramitador de Siniestros. **Kevin está en proceso de aprendizaje** — es su primer proyecto con backend desacoplado. Experiencia previa: JS vanilla, HTML, CSS, Supabase directo desde el frontend (proyecto Siniestros Tajy).

**Por esto, Claude Code debe:**
- Explicar decisiones técnicas no obvias antes de codear
- Escribir comentarios explicativos en código complejo
- Sugerir el commit message después de cada cambio significativo, tambien que sea en español
- Comunicarse siempre en español
- Pedir confirmación antes de cambios grandes o destructivos

**Locale**: Español (Paraguay, es-PY), zona horaria GMT-4, moneda Guaraní (Gs.)

---

## Stack tecnológico

- **Backend**: Node.js + Express + Supabase JS client (service role key)
- **Base de datos**: Supabase (PostgreSQL gestionado)
- **Frontend**: JavaScript vanilla ES6+ + HTML5 + CSS3 modular (sin framework, sin bundler)
- **Autenticación**: Supabase Auth con tokens JWT
- **Validaciones backend**: Zod
- **Deploy backend**: Railway o Render (tier gratuito)
- **Deploy frontend**: Netlify (CI/CD automático desde GitHub)
- **Versionado**: Git + GitHub (monorepo)

---

## Arquitectura

### Separación frontend ↔ backend (CRÍTICO)

A diferencia del proyecto anterior (Siniestros Tajy), el frontend **NUNCA** se conecta directamente a Supabase para datos del negocio. Todo pasa por la API Express.

```
[Frontend - Netlify]
       ↓ fetch() + JWT header
[Backend Express - Railway]
       ↓ Supabase JS client (service role)
[Supabase - PostgreSQL]
```

El frontend solo usa Supabase directamente para **login** (anon key). Para todo lo demás, llama al backend.

### Capas del backend

```
Route → Middleware (auth, validate) → Controller → Service → Supabase
```

- **Route**: define el endpoint, aplica middlewares
- **Controller**: orquesta request/response, llama al service, formatea respuesta
- **Service**: lógica de negocio, queries a Supabase
- **Nunca** hacer queries a Supabase desde controllers — siempre via service

### Estructura del repositorio

```
gestion-tajy/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Un archivo por recurso
│   │   ├── routes/          # Un archivo por recurso + index.js
│   │   ├── services/        # Lógica de negocio y queries
│   │   ├── models/          # Schemas Zod de validación
│   │   ├── middlewares/     # auth, roles, errorHandler, validate
│   │   └── utils/           # logger, dateHelpers, responseHelper
│   ├── config/
│   │   ├── supabase.js      # Singleton del cliente Supabase
│   │   └── env.js           # Carga y valida variables de entorno
│   ├── .env                 # NUNCA commitear
│   ├── .env.example         # SÍ commitear, sin valores reales
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Modal, Toast, Table, Pagination
│   │   ├── pages/           # Una función render() por vista
│   │   ├── services/        # Wrappers de fetch() a la API
│   │   ├── store/           # Estado global (auth, app)
│   │   ├── router/          # SPA router sin recarga
│   │   └── utils/           # formatters, validators, domHelpers, constants
│   ├── styles/
│   │   ├── base/            # reset, variables, typography
│   │   ├── components/      # Un archivo CSS por componente
│   │   ├── pages/           # Un archivo CSS por página
│   │   └── main.css         # Importa todos los anteriores
│   ├── assets/
│   ├── public/              # manifest.json, service-worker.js
│   └── index.html
│
├── database/
│   ├── migrations/          # 001_*.sql, 002_*.sql — aplicar en orden
│   ├── seeds/               # Datos iniciales (departamentos, artículos test)
│   └── schema.sql           # Esquema completo de referencia
│
├── docs/
├── PLAN_DESARROLLO.md
├── README.md
└── CLAUDE.md                # este archivo
```

---

## Módulo 1: Inventario de insumos (en desarrollo)

### Entidades

- **articulo**: insumo del catálogo (código, nombre, categoría, precio, stock actual, stock mínimo, unidad de medida)
- **proveedor**: proveedor de insumos (nombre, RUC, contacto)
- **departamento**: los 12 departamentos de Tajy con centro de costo
- **ingreso**: entrada de mercancía al depósito (incrementa stock via trigger)
- **salida**: entrega de insumo a un colaborador (decrementa stock via trigger, valida disponibilidad)
- **usuario**: extensión de auth.users con rol y departamento

### Triggers de Postgres (CRÍTICO — no modificar desde el backend)

El stock se actualiza **exclusivamente** con triggers en la base de datos, no desde el backend.

- **trigger_ingreso_stock**: `AFTER INSERT ON ingresos` → suma cantidad a `articulos.stock_actual`
- **trigger_salida_stock**: `BEFORE INSERT ON salidas` → valida stock suficiente, luego resta

Si el trigger rechaza una salida por stock insuficiente, lanza una excepción que el backend debe capturar y devolver como error 400 con mensaje claro en español.

### Roles del módulo de inventario

| Acción                          | consultor | operador | admin |
|---------------------------------|-----------|----------|-------|
| Ver dashboard y reportes        | ✅        | ✅       | ✅    |
| Ver catálogo de artículos       | ✅        | ✅       | ✅    |
| Ver historial de movimientos    | ✅        | ✅       | ✅    |
| Registrar ingresos y salidas    | ❌        | ✅       | ✅    |
| CRUD de artículos               | ❌        | ❌       | ✅    |
| CRUD de proveedores             | ❌        | ❌       | ✅    |
| Gestionar usuarios              | ❌        | ❌       | ✅    |

Los roles se almacenan en `usuarios.rol` y se aplican via RLS en Supabase **y** via middleware `roles.middleware.js` en el backend. Nunca confiar en un solo punto de control.

---

## Módulo 2: Flota vehicular (planificado para siguiente fase)

### Entidades

- **vehiculo**: unidad de flota (chapa del vehiculo, marca, modelo, año, estado, kilometraje)
- **solicitud_vehiculo**: solicitud de uso (solicitante, vehículo, fechas, destino, propósito, estado)
- **mantenimiento**: registro de service por vehículo

### Ciclo de vida de una solicitud

```
PENDIENTE → APROBADA → EN_USO → FINALIZADA
         ↘ RECHAZADA
```

- `user` crea solicitud → `PENDIENTE`
- `manager` o `admin` aprueba → `APROBADA`
- Vehículo retirado → `EN_USO`
- Vehículo devuelto → `FINALIZADA`
- Manager/admin rechaza → `RECHAZADA`

### Estados del vehículo

`DISPONIBLE | EN_USO | MANTENIMIENTO | FUERA_DE_SERVICIO`

### Roles del módulo de flota

| Acción                              | user | manager | admin |
|-------------------------------------|------|---------|-------|
| Crear solicitud de uso              | ✅   | ✅      | ✅    |
| Ver sus propias solicitudes         | ✅   | ✅      | ✅    |
| Ver todas las solicitudes           | ❌   | ✅      | ✅    |
| Aprobar / rechazar solicitudes      | ❌   | ✅      | ✅    |
| Marcar vehículo en uso / devuelto   | ❌   | ✅      | ✅    |
| Gestionar inventario de vehículos   | ❌   | ❌      | ✅    |
| Gestionar usuarios                  | ❌   | ❌      | ✅    |
| Ver dashboard / KPIs                | ❌   | ✅      | ✅    |

---

## Convenciones de código

### Idioma
- Código (variables, funciones, archivos): **inglés para keywords, español para dominio**
  - ✅ `getArticulos()`, `crearIngreso()`, `validarStockSuficiente()`
  - ❌ `getArticles()`, `createEntry()`, `validateStock()`
- Comentarios, mensajes de error, logs, commits: **siempre español**
- Booleanos con prefijo descriptivo: `esActivo`, `tieneStock`, `puedeEditar`

### JavaScript (backend y frontend)
- Módulos ES6+ (`type="module"` en script tags del frontend, `require`/`import` en backend)
- Sin `var` — `const` por defecto, `let` solo cuando hay reasignación
- `async/await` en todas partes — sin cadenas `.then()` crudas
- Siempre `try/catch` en llamadas a Supabase y fetch — nunca ignorar errores silenciosamente
- Sin event handlers inline en HTML (`onclick="..."`) — vincular desde los módulos JS
- Cachear selectores del DOM en el scope del módulo, no dentro de loops

### Naming
- Funciones y variables: `camelCase`
- Constantes y configuración: `UPPER_SNAKE_CASE`
- Clases CSS: `kebab-case`
- Tablas y columnas en Supabase: `snake_case`
- Archivos: `kebab-case.js`

### Backend
- Respuestas consistentes:
  ```js
  // Éxito
  res.json({ success: true, data, message: 'Opcional' });
  // Error
  res.status(400).json({ success: false, error: 'Mensaje en español' });
  ```
- Validar con Zod **antes** de tocar la base de datos
- Status HTTP correcto: 400 validación, 401 sin auth, 403 sin permisos, 404 no encontrado, 500 servidor

### Frontend
- Cada página en `pages/` exporta `render(container)` que monta HTML y event listeners
- Servicios en `services/` devuelven `Promise`, nunca tocan el DOM
- Variables CSS en `styles/base/variables.css` — nunca hardcodear colores o espaciados
- Estados de carga: deshabilitar botones y mostrar spinner mientras hay operaciones async
- Errores: mostrar con componente `Toast`, nunca con `alert()`
- Confirmaciones destructivas (eliminar, rechazar): siempre usar modal
- Fechas: mostrar como `DD/MM/YYYY` (es-PY), almacenar como ISO 8601 en la DB
- Estados vacíos: siempre mostrar mensaje cuando una tabla no tiene filas

---

## Patrones de código reutilizables

### Fetch a la API del backend (frontend)
```js
// frontend/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL;

async function apiFetch(endpoint, options = {}) {
  const token = await getAuthToken(); // desde auth.store.js
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error desconocido');
  return data;
}
```

### Query a Supabase con manejo de errores (backend)
```js
async function getArticulos({ categoria, search } = {}) {
  let query = supabase
    .from('articulos')
    .select('id, codigo, nombre, categoria, precio_unitario, stock_actual, stock_minimo')
    .eq('activo', true)
    .order('nombre');

  if (categoria) query = query.eq('categoria', categoria);
  if (search) query = query.ilike('nombre', `%${search}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
```

### Guard de rol (backend middleware)
```js
function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ success: false, error: 'No tenés permisos para realizar esta acción.' });
    }
    next();
  };
}
```

### Suscripción Realtime (frontend — módulo de flota)
```js
supabase
  .channel('solicitudes-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'solicitud_vehiculo',
    filter: `solicitante_id=eq.${userId}`
  }, handleSolicitudUpdate)
  .subscribe();
```

---

## Variables de entorno

### backend/.env (NUNCA commitear)
```
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # service role key, no anon
JWT_SECRET=xxx
CORS_ORIGIN=http://localhost:5500,https://gestion-tajy.netlify.app
```

### frontend (variables de entorno o config.js — NUNCA commitear con valores reales)
```
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # anon key, no service
```

---

## Git workflow

### Branches
- **main**: producción, deploys automáticos en Netlify y Railway
- **develop**: integración
- **feature/nombre**: ramas por funcionalidad

### Commits (en español)
```
tipo(scope): descripción breve
```
Tipos: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

Ejemplos:
- `feat(articulos): agregar filtro por categoria`
- `fix(salidas): validar stock antes de insertar`
- `refactor(reportes): extraer cálculo a service`
- `docs(readme): actualizar instrucciones de setup`

---

## Desarrollo local

```bash
# Backend
cd backend
npm install
npm run dev       # nodemon con hot reload

# Frontend
cd frontend
npx serve .       # o python -m http.server 8080
# Abrir http://localhost:8080
```

---

## Deploy

- **Frontend**: push a `main` → Netlify despliega automáticamente
- **Backend**: push a `main` → Railway/Render despliega automáticamente
- **Base de datos**: ejecutar migraciones SQL manualmente en Supabase SQL Editor, en orden (001 → 002 → 003), antes de deployar cambios de esquema
- Las claves de Supabase se configuran en el dashboard de Netlify/Railway, no en archivos commiteados

---

## Fuera de alcance (por ahora)

- Seguimiento GPS de vehículos
- App móvil nativa
- Control de gastos de combustible por vehículo
- Alertas de vencimiento de licencias de conducir
- Integración con sistemas contables externos
- Módulo de ventas (los insumos no se venden, se consumen internamente)

---

## Lo que NO hacer (reglas estrictas)

- ❌ El frontend NO conecta directo a Supabase para datos del negocio
- ❌ NO actualizar `stock_actual` desde el backend — solo via triggers de Postgres
- ❌ NO hardcodear colores, espaciados ni URLs — usar variables CSS y variables de entorno
- ❌ NO usar `console.log` en producción — usar `logger.js`
- ❌ NO commitear `.env` ni `config.js` con claves reales
- ❌ NO usar `alert()` para errores de UI — usar componente Toast
- ❌ NO usar frameworks de frontend (React, Vue) — vanilla intencionalmente
- ❌ NO escribir nombres de dominio en inglés (`articulo` no `article`, `ingreso` no `entry`)
- ❌ NO omitir validaciones Zod en endpoints POST/PUT
- ❌ NO hacer queries Supabase desde controllers — siempre via services
- ❌ NO usar `SELECT *` — listar columnas explícitamente
- ❌ NO confiar solo en guards del cliente para permisos — siempre RLS + middleware backend
