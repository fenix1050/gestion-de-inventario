-- =============================================================
-- GESTION DE INVENTARIO Y VEHICULOS
-- Supabase Schema Setup
-- Run in order: extensions → tables → indexes → RLS → triggers
-- =============================================================


-- =============================================================
-- EXTENSIONS
-- =============================================================
create extension if not exists "uuid-ossp";


-- =============================================================
-- TABLES
-- =============================================================

-- Users (mirrors auth.users with app-level role)
create table if not exists public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null unique,
  rol         text not null default 'user' check (rol in ('admin', 'manager', 'user')),
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Vehicle fleet
create table if not exists public.vehiculos (
  id              uuid primary key default uuid_generate_v4(),
  patente         text not null unique,
  marca           text not null,
  modelo          text not null,
  anio            smallint not null check (anio >= 1990 and anio <= 2100),
  tipo            text not null check (tipo in ('AUTO', 'CAMIONETA', 'CAMION', 'MOTO', 'OTRO')),
  combustible     text not null check (combustible in ('NAFTA', 'DIESEL', 'ELECTRICO', 'GNC', 'HIBRIDO')),
  color           text,
  odometro_km     integer not null default 0 check (odometro_km >= 0),
  estado          text not null default 'DISPONIBLE'
                    check (estado in ('DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO')),
  observaciones   text,
  foto_url        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Usage requests
create table if not exists public.solicitudes (
  id                  uuid primary key default uuid_generate_v4(),
  vehiculo_id         uuid not null references public.vehiculos(id),
  solicitante_id      uuid not null references public.usuarios(id),
  aprobador_id        uuid references public.usuarios(id),

  -- Request details
  fecha_inicio        date not null,
  fecha_fin           date not null,
  hora_salida         time not null,
  hora_retorno_est    time not null,
  destino             text not null,
  proposito           text not null,
  pasajeros           smallint not null default 1 check (pasajeros >= 1),

  -- Lifecycle
  estado              text not null default 'PENDIENTE'
                        check (estado in ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'EN_USO', 'FINALIZADA', 'CANCELADA')),
  motivo_rechazo      text,

  -- Actual usage (filled on return)
  odometro_salida     integer check (odometro_salida >= 0),
  odometro_retorno    integer check (odometro_retorno >= 0),
  hora_retorno_real   time,
  observaciones_uso   text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint fecha_valida check (fecha_fin >= fecha_inicio),
  constraint odometro_valido check (
    odometro_retorno is null or odometro_salida is null
    or odometro_retorno >= odometro_salida
  )
);

-- Maintenance records
create table if not exists public.mantenimientos (
  id              uuid primary key default uuid_generate_v4(),
  vehiculo_id     uuid not null references public.vehiculos(id),
  registrado_por  uuid not null references public.usuarios(id),

  tipo            text not null check (tipo in ('PREVENTIVO', 'CORRECTIVO', 'REVISION', 'OTRO')),
  descripcion     text not null,
  taller          text,
  costo_gs        integer check (costo_gs >= 0),
  odometro_km     integer check (odometro_km >= 0),
  fecha_entrada   date not null,
  fecha_salida    date,
  observaciones   text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint fechas_mantenimiento check (fecha_salida is null or fecha_salida >= fecha_entrada)
);


-- =============================================================
-- INDEXES
-- =============================================================

create index if not exists idx_vehiculos_estado    on public.vehiculos(estado);
create index if not exists idx_vehiculos_patente   on public.vehiculos(patente);

create index if not exists idx_solicitudes_estado        on public.solicitudes(estado);
create index if not exists idx_solicitudes_solicitante   on public.solicitudes(solicitante_id);
create index if not exists idx_solicitudes_vehiculo      on public.solicitudes(vehiculo_id);
create index if not exists idx_solicitudes_fechas        on public.solicitudes(fecha_inicio, fecha_fin);

create index if not exists idx_mantenimientos_vehiculo   on public.mantenimientos(vehiculo_id);
create index if not exists idx_mantenimientos_fechas     on public.mantenimientos(fecha_entrada);


-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_usuarios_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

create trigger trg_vehiculos_updated_at
  before update on public.vehiculos
  for each row execute function public.set_updated_at();

create trigger trg_solicitudes_updated_at
  before update on public.solicitudes
  for each row execute function public.set_updated_at();

create trigger trg_mantenimientos_updated_at
  before update on public.mantenimientos
  for each row execute function public.set_updated_at();


-- =============================================================
-- VEHICLE STATUS SYNC TRIGGER
-- Keeps vehiculos.estado in sync with solicitudes transitions
-- =============================================================

create or replace function public.sync_vehiculo_estado()
returns trigger language plpgsql security definer as $$
begin
  -- Vehicle goes into use
  if new.estado = 'EN_USO' and old.estado = 'APROBADA' then
    update public.vehiculos set estado = 'EN_USO' where id = new.vehiculo_id;

  -- Vehicle returned
  elsif new.estado = 'FINALIZADA' and old.estado = 'EN_USO' then
    update public.vehiculos set estado = 'DISPONIBLE' where id = new.vehiculo_id;
    -- Update odometer if provided
    if new.odometro_retorno is not null then
      update public.vehiculos
        set odometro_km = new.odometro_retorno
        where id = new.vehiculo_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_sync_vehiculo_estado
  after update on public.solicitudes
  for each row execute function public.sync_vehiculo_estado();


-- =============================================================
-- VEHICLE AVAILABILITY CHECK
-- Prevents overlapping approved/active requests for same vehicle
-- =============================================================

create or replace function public.check_vehiculo_disponible()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.solicitudes
    where vehiculo_id = new.vehiculo_id
      and id != new.id
      and estado in ('APROBADA', 'EN_USO')
      and fecha_inicio <= new.fecha_fin
      and fecha_fin   >= new.fecha_inicio
  ) then
    raise exception 'El vehículo ya tiene una solicitud activa en ese rango de fechas.';
  end if;
  return new;
end;
$$;

create trigger trg_check_disponibilidad
  before insert or update on public.solicitudes
  for each row
  when (new.estado in ('PENDIENTE', 'APROBADA'))
  execute function public.check_vehiculo_disponible();


-- =============================================================
-- AUTO-CREATE usuario ON SIGNUP
-- =============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuarios (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'user')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================
-- HELPER: current user role
-- =============================================================

create or replace function public.get_user_role()
returns text language sql security definer stable as $$
  select rol from public.usuarios where id = auth.uid();
$$;


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table public.usuarios        enable row level security;
alter table public.vehiculos       enable row level security;
alter table public.solicitudes     enable row level security;
alter table public.mantenimientos  enable row level security;


-- ---- usuarios -----------------------------------------------

-- Users can read their own row; admin sees all
create policy "usuarios: read own or admin"
  on public.usuarios for select
  using (
    id = auth.uid()
    or public.get_user_role() in ('admin', 'manager')
  );

-- Only admin can insert / update / delete users
create policy "usuarios: admin write"
  on public.usuarios for all
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');


-- ---- vehiculos -----------------------------------------------

-- All authenticated users can read vehicles
create policy "vehiculos: read authenticated"
  on public.vehiculos for select
  using (auth.uid() is not null);

-- Only admin can write vehicles
create policy "vehiculos: admin write"
  on public.vehiculos for insert update delete
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');


-- ---- solicitudes ---------------------------------------------

-- Users see their own; managers/admin see all
create policy "solicitudes: read"
  on public.solicitudes for select
  using (
    solicitante_id = auth.uid()
    or public.get_user_role() in ('admin', 'manager')
  );

-- Any authenticated user can create a request for themselves
create policy "solicitudes: insert own"
  on public.solicitudes for insert
  with check (
    solicitante_id = auth.uid()
    and auth.uid() is not null
  );

-- Requester can cancel their own PENDING request
-- Manager/admin can approve, reject, update lifecycle
create policy "solicitudes: update"
  on public.solicitudes for update
  using (
    (solicitante_id = auth.uid() and estado = 'PENDIENTE')
    or public.get_user_role() in ('admin', 'manager')
  );

-- Only admin can hard-delete (soft preferred via CANCELADA status)
create policy "solicitudes: admin delete"
  on public.solicitudes for delete
  using (public.get_user_role() = 'admin');


-- ---- mantenimientos -----------------------------------------

-- Manager and admin can read maintenance
create policy "mantenimientos: read"
  on public.mantenimientos for select
  using (public.get_user_role() in ('admin', 'manager'));

-- Admin can write maintenance records
create policy "mantenimientos: admin write"
  on public.mantenimientos for insert update delete
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');


-- =============================================================
-- SEED DATA (optional — comment out for production)
-- =============================================================

/*
-- Test admin user (create via Supabase Auth first, then update rol)
-- update public.usuarios set rol = 'admin' where email = 'admin@empresa.com';

-- Sample vehicles
insert into public.vehiculos (patente, marca, modelo, anio, tipo, combustible, color) values
  ('ABC 123', 'Toyota',      'Hilux',     2022, 'CAMIONETA', 'DIESEL', 'Blanco'),
  ('DEF 456', 'Ford',        'Ranger',    2021, 'CAMIONETA', 'DIESEL', 'Gris'),
  ('GHI 789', 'Volkswagen',  'Amarok',    2023, 'CAMIONETA', 'DIESEL', 'Negro'),
  ('JKL 012', 'Toyota',      'Corolla',   2020, 'AUTO',      'NAFTA',  'Plata'),
  ('MNO 345', 'Honda',       'CB500',     2019, 'MOTO',      'NAFTA',  'Rojo');
*/
