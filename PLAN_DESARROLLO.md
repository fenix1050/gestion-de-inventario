# Plan de Desarrollo · Sistema de Gestión Tajy

## Contexto del proyecto

Sistema interno para Aseguradora Tajy que gestiona dos módulos principales:

1. **Inventario de insumos internos** (papelería, ofética) — empezamos por acá
2. **Flota vehicular** con solicitudes de uso — siguiente fase

Desarrollado por Kevin Ruiz Díaz (Tramitador de Siniestros), como proyecto interno para automatizar procesos administrativos de la aseguradora.

---

## Stack tecnológico

- **Backend**: Node.js + Express + Supabase JS client
- **Base de datos**: Supabase (PostgreSQL gestionado)
- **Frontend**: JavaScript vanilla + HTML + CSS modular
- **Autenticación**: Supabase Auth (JWT)
- **Validaciones backend**: Zod
- **Deploy backend**: Railway o Render (tier gratuito)
- **Deploy frontend**: Netlify (con CI/CD desde GitHub)
- **Control de versiones**: Git + GitHub (monorepo)

---

## Decisiones de arquitectura

### Backend desacoplado del frontend
A diferencia del proyecto anterior (Siniestros Tajy), el frontend **NO se conecta directamente a Supabase**. Toda comunicación con la base de datos pasa por la API Express, que valida JWT y aplica lógica de negocio.

### Triggers de Postgres para integridad
Las actualizaciones de stock se hacen con triggers en la base de datos, no en el backend. Esto garantiza que el stock sea siempre consistente.

### CSS desacoplado por módulo
Archivos CSS separados por componente y página, importados desde un `main.css`. Sin estilos inline ni archivos monolíticos.

### Variables de entorno
Nunca commitear `.env`. Solo se commitea `.env.example` con las claves sin valores reales.

---

## Estructura de carpetas

```
gestion-tajy/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── articulos.controller.js
│   │   │   ├── ingresos.controller.js
│   │   │   ├── salidas.controller.js
│   │   │   ├── proveedores.controller.js
│   │   │   ├── departamentos.controller.js
│   │   │   ├── historial.controller.js
│   │   │   ├── reportes.controller.js
│   │   │   ├── auth.controller.js
│   │   │   └── usuarios.controller.js
│   │   ├── routes/
│   │   │   ├── articulos.routes.js
│   │   │   ├── ingresos.routes.js
│   │   │   ├── salidas.routes.js
│   │   │   ├── proveedores.routes.js
│   │   │   ├── departamentos.routes.js
│   │   │   ├── historial.routes.js
│   │   │   ├── reportes.routes.js
│   │   │   ├── auth.routes.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── articulos.service.js
│   │   │   ├── ingresos.service.js
│   │   │   ├── salidas.service.js
│   │   │   ├── stock.service.js
│   │   │   ├── alertas.service.js
│   │   │   └── reportes.service.js
│   │   ├── models/
│   │   │   ├── articulo.model.js
│   │   │   ├── ingreso.model.js
│   │   │   └── salida.model.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── roles.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.middleware.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── dateHelpers.js
│   │   │   └── responseHelper.js
│   │   └── app.js
│   ├── config/
│   │   ├── supabase.js
│   │   └── env.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Sidebar.js
│   │   │   ├── Modal.js
│   │   │   ├── Toast.js
│   │   │   ├── Table.js
│   │   │   ├── SearchBar.js
│   │   │   └── Pagination.js
│   │   ├── pages/
│   │   │   ├── login.js
│   │   │   ├── dashboard.js
│   │   │   ├── articulos.js
│   │   │   ├── ingresos.js
│   │   │   ├── salidas.js
│   │   │   ├── historial.js
│   │   │   └── reportes.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.service.js
│   │   │   ├── articulos.service.js
│   │   │   ├── ingresos.service.js
│   │   │   ├── salidas.service.js
│   │   │   └── reportes.service.js
│   │   ├── store/
│   │   │   ├── auth.store.js
│   │   │   └── app.store.js
│   │   ├── utils/
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   ├── domHelpers.js
│   │   │   └── constants.js
│   │   ├── router/
│   │   │   └── router.js
│   │   └── main.js
│   ├── styles/
│   │   ├── base/
│   │   │   ├── reset.css
│   │   │   ├── variables.css
│   │   │   └── typography.css
│   │   ├── components/
│   │   │   ├── navbar.css
│   │   │   ├── sidebar.css
│   │   │   ├── modal.css
│   │   │   ├── table.css
│   │   │   └── buttons.css
│   │   ├── pages/
│   │   │   ├── dashboard.css
│   │   │   ├── articulos.css
│   │   │   ├── ingresos.css
│   │   │   ├── salidas.css
│   │   │   └── reportes.css
│   │   └── main.css
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── service-worker.js
│   ├── index.html
│   ├── netlify.toml
│   └── README.md
│
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_triggers_stock.sql
│   │   └── 003_rls_policies.sql
│   ├── seeds/
│   │   ├── seed_departamentos.sql
│   │   └── seed_articulos.sql
│   └── schema.sql
│
├── docs/
│   ├── ARQUITECTURA.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ROLES.md
│
├── .gitignore
├── README.md
└── CLAUDE.md
```

---

## Modelo de datos (Supabase)

### Tabla `articulos`
```
id              uuid PK
codigo          text UNIQUE NOT NULL  -- "ART-001"
nombre          text NOT NULL
descripcion     text
categoria       text  -- papeleria, ofetica, toner, limpieza, otros
precio_unitario numeric(12,2) NOT NULL
stock_actual    integer DEFAULT 0
stock_minimo    integer DEFAULT 0
unidad_medida   text NOT NULL  -- unidad, caja, paquete, litro, kg
activo          boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Tabla `proveedores`
```
id          uuid PK
nombre      text NOT NULL
ruc         text
telefono    text
email       text
contacto    text
activo      boolean DEFAULT true
created_at  timestamptz DEFAULT now()
```

### Tabla `departamentos`
```
id              uuid PK
nombre          text NOT NULL  -- Siniestros, Atencion al Cliente, etc.
codigo          text UNIQUE
centro_costo    text  -- CC-101, CC-201, etc.
activo          boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### Tabla `ingresos`
```
id              uuid PK
articulo_id     uuid FK -> articulos
cantidad        integer NOT NULL CHECK (cantidad > 0)
precio_unitario numeric(12,2) NOT NULL
proveedor_id    uuid FK -> proveedores
referencia      text  -- numero de factura/remito
observaciones   text
usuario_id      uuid FK -> auth.users
fecha           date NOT NULL DEFAULT CURRENT_DATE
created_at      timestamptz DEFAULT now()
```

### Tabla `salidas`
```
id              uuid PK
articulo_id     uuid FK -> articulos
cantidad        integer NOT NULL CHECK (cantidad > 0)
colaborador_id  uuid FK -> auth.users  -- a quién se entrega
departamento_id uuid FK -> departamentos
centro_costo    text  -- duplicado para historico
motivo          text  -- uso operativo, reposicion, solicitud especial
observaciones   text
usuario_id      uuid FK -> auth.users  -- quién registra
fecha           date NOT NULL DEFAULT CURRENT_DATE
created_at      timestamptz DEFAULT now()
```

### Tabla `usuarios` (extensión de auth.users)
```
id              uuid PK FK -> auth.users
nombre_completo text NOT NULL
cedula          text
telefono        text
departamento_id uuid FK -> departamentos
rol             text NOT NULL  -- admin, operador, consultor
activo          boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

---

## Roles y permisos

- **admin**: CRUD completo de todo, gestión de usuarios y configuración
- **operador**: registra ingresos y salidas, ve historial completo, no edita catálogo ni usuarios
- **consultor**: solo lectura del dashboard, historial y reportes (sin registrar movimientos)

Implementar con Row Level Security (RLS) en Supabase y middleware `roles.middleware.js` en el backend.

---

## Triggers críticos de Postgres

### Trigger: actualizar stock en ingresos
```sql
CREATE OR REPLACE FUNCTION actualizar_stock_ingreso()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articulos
  SET stock_actual = stock_actual + NEW.cantidad,
      updated_at = now()
  WHERE id = NEW.articulo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ingreso_stock
AFTER INSERT ON ingresos
FOR EACH ROW EXECUTE FUNCTION actualizar_stock_ingreso();
```

### Trigger: actualizar stock en salidas (con validación)
```sql
CREATE OR REPLACE FUNCTION actualizar_stock_salida()
RETURNS TRIGGER AS $$
DECLARE
  stock_disponible INTEGER;
BEGIN
  SELECT stock_actual INTO stock_disponible
  FROM articulos WHERE id = NEW.articulo_id;

  IF stock_disponible < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, solicitado: %',
      stock_disponible, NEW.cantidad;
  END IF;

  UPDATE articulos
  SET stock_actual = stock_actual - NEW.cantidad,
      updated_at = now()
  WHERE id = NEW.articulo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_salida_stock
BEFORE INSERT ON salidas
FOR EACH ROW EXECUTE FUNCTION actualizar_stock_salida();
```

---

## Endpoints de la API (resumen)

### Auth
- `POST /api/auth/login` — login con Supabase Auth
- `POST /api/auth/logout`
- `GET /api/auth/me` — datos del usuario logueado

### Artículos
- `GET /api/articulos` — listado con filtros (categoria, search, activo)
- `GET /api/articulos/:id`
- `POST /api/articulos` — solo admin
- `PUT /api/articulos/:id` — solo admin
- `DELETE /api/articulos/:id` — soft delete, solo admin
- `GET /api/articulos/stock-bajo` — artículos con stock <= stock_minimo

### Ingresos
- `GET /api/ingresos` — listado con filtros (fecha, articulo, proveedor)
- `POST /api/ingresos` — admin y operador
- `GET /api/ingresos/:id`

### Salidas
- `GET /api/salidas` — listado con filtros (fecha, articulo, departamento, colaborador)
- `POST /api/salidas` — admin y operador
- `GET /api/salidas/:id`

### Proveedores y Departamentos
- CRUD completos, solo admin

### Historial
- `GET /api/historial` — vista unificada de ingresos + salidas con filtros

### Reportes
- `GET /api/reportes/consumo-periodo?desde=&hasta=`
- `GET /api/reportes/por-departamento?desde=&hasta=`
- `GET /api/reportes/mas-consumidos?desde=&hasta=&limit=10`
- `GET /api/reportes/valor-total`
- `GET /api/reportes/proyeccion`

---

## Fases de desarrollo

### Fase 1 — Setup y fundamentos (semanas 1-2)

**Objetivos**:
- Repositorio en GitHub con estructura completa
- Backend Express funcionando con primer endpoint
- Frontend con login conectado
- Base de datos Supabase con esquema completo

**Tareas**:
1. Crear repo `gestion-tajy` en GitHub con estructura de carpetas
2. Configurar `.gitignore` y `.env.example` en backend y frontend
3. Conectar Netlify al repo para deploys automáticos del frontend
4. Crear proyecto en Supabase y obtener credenciales
5. Ejecutar `001_initial_schema.sql` para crear todas las tablas
6. Ejecutar `002_triggers_stock.sql` para los triggers
7. Ejecutar `003_rls_policies.sql` con políticas de RLS por rol
8. Insertar seeds: 12 departamentos de Tajy + 5-10 artículos de prueba
9. Inicializar backend con `npm init` + instalar Express, Supabase JS, Zod, cors, dotenv
10. Configurar `app.js`, `server.js`, conexión a Supabase y middleware de auth
11. Implementar endpoint `GET /api/articulos` como prueba
12. Inicializar frontend con `index.html`, `main.js`, router básico
13. Implementar página de login conectada al backend
14. Deploy del backend en Railway o Render
15. Verificar que frontend en Netlify llama correctamente al backend

**Criterio de éxito**: poder loguearse desde el frontend en producción y ver una lista vacía de artículos traída del backend.

### Fase 2 — Catálogo de artículos (semana 3)

**Objetivos**: CRUD completo de artículos con buena UX.

**Tareas**:
1. Endpoint completo `articulos.controller.js` (GET, POST, PUT, DELETE soft)
2. Validaciones con Zod en `articulo.model.js`
3. Página `articulos.js` con tabla
4. Búsqueda en vivo (debounced) por código y nombre
5. Filtro por categoría
6. Modal para crear/editar artículo
7. Confirmación antes de eliminar
8. Badges de color según stock vs stock_minimo
9. Toast de feedback en cada acción
10. Manejo de errores con mensajes claros

**Criterio de éxito**: poder gestionar artículos completamente desde la UI con validaciones y feedback visual.

### Fase 3 — Movimientos de stock (semana 4)

**Objetivos**: registrar ingresos y salidas que actualicen stock automáticamente.

**Tareas**:
1. Endpoints de ingresos y salidas
2. CRUD de proveedores (solo lo necesario)
3. Página de ingresos con formulario completo
4. Página de salidas con formulario completo
5. Selector de artículo con búsqueda
6. Selector de colaborador y departamento (autocompletar centro de costo)
7. Resumen en vivo del formulario antes de confirmar
8. Validación en backend: stock suficiente para salidas
9. Mostrar mensaje claro si el trigger rechaza la salida
10. Listados con filtros de fecha y tipo

**Criterio de éxito**: registrar ingresos/salidas y ver el stock actualizado automáticamente. Si no hay stock para una salida, error claro.

### Fase 4 — Historial y dashboard (semana 5)

**Objetivos**: vista consolidada y dashboard con KPIs reales.

**Tareas**:
1. Endpoint `historial.controller.js` con UNION de ingresos y salidas
2. Página de historial con tabla, filtros (fecha desde/hasta, tipo, departamento, artículo)
3. Export a Excel con SheetJS
4. Dashboard con KPIs: total artículos, valor total, movimientos hoy, alertas
5. Lista de artículos con stock bajo (top 5)
6. Barras de top departamentos del mes (consumo en Gs.)
7. Acceso directo desde alertas a "Reponer" (preselección de artículo en formulario de ingreso)

**Criterio de éxito**: dashboard se carga en menos de 1.5s con datos reales y todas las cifras coinciden con la suma de movimientos.

### Fase 5 — Reportes y análisis (semana 6)

**Objetivos**: reportes con gráficos para análisis gerencial.

**Tareas**:
1. Endpoint `reportes.service.js` con agregaciones SQL
2. Chart.js: gráfico de barras de consumo por artículo
3. Gráfico de torta de distribución por departamento
4. Tabla de top 10 artículos más consumidos
5. Tabla de valor total del inventario por categoría
6. Cálculo simple de proyección (promedio de últimos 3 meses)
7. Filtros de período aplicables a todos los reportes
8. Export a PDF (opcional, usar `jsPDF`) o Excel

**Criterio de éxito**: poder generar y descargar al menos 3 reportes distintos con datos reales.

### Fase 6 — Refinamiento (semana 7)

**Objetivos**: pulir la experiencia y agregar features avanzadas.

**Tareas**:
1. Alertas automáticas in-app (badge en bell del navbar)
2. Real-time con Supabase subscriptions (las salidas aparecen al instante en otros dispositivos)
3. PWA: manifest.json + service worker
4. Optimistic UI en acciones frecuentes (registrar salida)
5. Mejoras de mobile (responsive completo)
6. Tests básicos del backend (al menos endpoints críticos)
7. Documentación de API en `docs/API.md`
8. README completo con instrucciones de setup

**Criterio de éxito**: sistema usable en móvil, alertas en tiempo real, documentación completa.

---

## Convenciones de código

### Backend
- Naming: camelCase para variables y funciones, PascalCase para clases
- Archivos: kebab-case con sufijo de tipo (`articulos.controller.js`)
- Todos los handlers async/await con try/catch
- Respuestas con formato consistente: `{ success: true, data, message }` o `{ success: false, error }`
- Validación con Zod ANTES de tocar la base de datos
- No queries directas a Supabase desde controllers — siempre vía services

### Frontend
- Naming: camelCase para JS, kebab-case para CSS classes
- Cada página exporta una función `render()` que retorna el HTML y monta listeners
- Servicios devuelven Promises, nunca manipulan el DOM
- Estilos por módulo, importados en `main.css`
- Variables CSS en `variables.css` para colores, espaciados y radios
- No `inline styles` excepto cuando son dinámicos (ej. width de una barra)

### Git
- Branches: `main` (producción), `develop` (integración), `feature/nombre-feature`
- Commits en español, formato: `tipo(scope): descripción`
  - Ej: `feat(articulos): agregar filtro por categoria`
  - Ej: `fix(salidas): validar stock suficiente antes de insertar`
  - Tipos: feat, fix, refactor, docs, style, test, chore
- PRs hacia `develop`, merge a `main` solo para releases

---

## Variables de entorno necesarias

### backend/.env
```
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # service role key, no anon
JWT_SECRET=xxx
CORS_ORIGIN=http://localhost:5500,https://gestion-tajy.netlify.app
```

### frontend/.env
```
VITE_API_URL=http://localhost:3000/api  # en producción será la URL de Railway
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # anon key, no service
```

---

## Tareas iniciales para Claude Code

Al pegar este plan en Claude Code, empezar con estos pedidos en orden:

1. "Crear la estructura completa de carpetas y archivos vacíos según el plan, en el directorio actual."
2. "Crear los archivos `package.json` de backend con todas las dependencias necesarias."
3. "Crear el `001_initial_schema.sql` con todas las tablas definidas en el plan, incluyendo índices."
4. "Crear `002_triggers_stock.sql` con los triggers de actualización de stock."
5. "Implementar `backend/config/supabase.js`, `backend/config/env.js`, `backend/src/app.js` y `backend/server.js`."
6. "Implementar el middleware de auth (`auth.middleware.js`) que valida JWT de Supabase."
7. "Implementar el endpoint `GET /api/articulos` completo: route, controller, service."
8. "Implementar `frontend/index.html`, `frontend/src/main.js` y el router básico."
9. "Implementar la página de login conectada al backend."
10. "Implementar la página de listado de artículos."

Después de cada paso, revisar el código generado, hacer commit y probar antes de seguir.
