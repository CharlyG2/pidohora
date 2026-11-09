-- PidoHora · Esquema base (Fase 0)
-- Tablas, relaciones, restricciones e índices. La seguridad (RLS) está en la migración siguiente
-- y las operaciones de reservas en la tercera. Ver docs/base-de-datos.md.
--
-- Reglas que se aplican en todo el esquema:
--   * Cada fila que pertenece a un negocio lleva business_id (aislamiento entre negocios).
--   * Las relaciones entre tablas de un mismo negocio usan claves compuestas (id, business_id),
--     así la base de datos impide mezclar, por ejemplo, un profesional de un negocio con un servicio de otro.
--   * Las horas se guardan con zona horaria (timestamptz); cada negocio guarda la suya.
--   * Las reservas nunca se borran: cambian de estado y dejan historial.

create extension if not exists btree_gist with schema extensions;

-- Esquema para funciones internas (no se publica en la API de Supabase).
create schema if not exists private;

-- ───────────────────────── Tipos ─────────────────────────

create type public.member_role as enum ('owner', 'admin', 'reception', 'staff');
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.booking_source as enum ('app', 'web', 'manual');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'refunded', 'cancelled');
create type public.transaction_kind as enum ('charge', 'deposit', 'commission', 'refund');
create type public.notification_channel as enum ('email', 'whatsapp', 'push');
create type public.notification_status as enum ('queued', 'sent', 'failed', 'cancelled');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');

-- ───────────────────────── Utilidades ─────────────────────────

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ───────────────────────── Personas ─────────────────────────

-- Datos de cada persona con cuenta. Se crea sola al registrarse (ver trigger más abajo).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (phone ~ '^\+?[0-9 ]{8,16}$'),
  home_comuna text check (char_length(home_comuna) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Negocios ─────────────────────────

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  -- Parte final del link público: pidohora.cl/<slug>
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name text not null check (char_length(name) between 2 and 80),
  category text not null check (category in ('barberia', 'peluqueria', 'estetica', 'unas', 'salud', 'masajes', 'mascotas', 'deporte', 'otro')),
  description text not null default '' check (char_length(description) <= 1000),
  phone text check (phone ~ '^\+?[0-9 ]{8,16}$'),
  timezone text not null default 'America/Santiago',
  -- Solo los negocios publicados se ven sin cuenta.
  is_published boolean not null default false,
  -- Hasta cuántos minutos antes el cliente puede cancelar o mover su hora.
  cancellation_window_minutes integer not null default 120 check (cancellation_window_minutes between 0 and 43200),
  -- Anticipación mínima y máxima para reservar.
  min_advance_minutes integer not null default 60 check (min_advance_minutes between 0 and 10080),
  max_advance_days integer not null default 60 check (max_advance_days between 1 and 365),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sucursales. En la Fase 1 cada negocio tiene una sola.
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null default 'Principal' check (char_length(name) between 1 and 80),
  address text not null default '' check (char_length(address) <= 200),
  comuna text not null default '' check (char_length(comuna) <= 60),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

-- Quién trabaja en qué negocio y con qué rol. Un usuario puede estar en varios negocios.
create table public.memberships (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- Profesionales que atienden. Pueden tener cuenta (user_id) o no.
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  role_title text not null default '' check (char_length(role_title) <= 60),
  color text not null default '#5B4CF5' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  duration_minutes integer not null check (duration_minutes between 5 and 720),
  -- Tiempo de limpieza o preparación después del servicio: bloquea la agenda, el cliente no lo ve.
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 120),
  price_clp integer not null check (price_clp between 0 and 10000000),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

-- Qué profesional hace qué servicio, con precio o duración propios si difieren.
create table public.staff_services (
  business_id uuid not null,
  staff_id uuid not null,
  service_id uuid not null,
  price_clp integer check (price_clp between 0 and 10000000),
  duration_minutes integer check (duration_minutes between 5 and 720),
  primary key (staff_id, service_id),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade,
  foreign key (service_id, business_id) references public.services (id, business_id) on delete cascade
);

-- Horario de atención de la sucursal (puede tener varios tramos por día).
create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  branch_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = domingo
  opens time not null,
  closes time not null,
  check (closes > opens),
  foreign key (branch_id, business_id) references public.branches (id, business_id) on delete cascade
);

-- Horario semanal de cada profesional, con tramos (por ejemplo 10:00–14:00 y 15:00–19:00).
create table public.staff_schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  staff_id uuid not null,
  branch_id uuid not null,
  weekday smallint not null check (weekday between 0 and 6),
  starts time not null,
  ends time not null,
  check (ends > starts),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade,
  foreign key (branch_id, business_id) references public.branches (id, business_id) on delete cascade,
  -- Dos tramos del mismo profesional el mismo día no pueden pisarse.
  exclude using gist (
    staff_id with =,
    weekday with =,
    tsrange('2000-01-01'::date + starts, '2000-01-01'::date + ends) with &&
  )
);

-- Bloqueos: vacaciones, feriados, trámites. Sin staff_id = bloquea a todo el negocio.
create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null default '' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade
);

-- ───────────────────────── Clientes y reservas ─────────────────────────

-- Ficha del cliente dentro de cada negocio. Un mismo usuario tiene una ficha por negocio.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text check (phone ~ '^\+?[0-9 ]{8,16}$'),
  email text check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);
create unique index customers_business_user_key on public.customers (business_id, user_id) where user_id is not null;
create unique index customers_business_phone_key on public.customers (business_id, phone) where phone is not null;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_id uuid not null,
  staff_id uuid not null,
  customer_id uuid not null,
  starts_at timestamptz not null,
  -- Fin de la atención (lo que ve el cliente).
  ends_at timestamptz not null,
  -- Fin del bloqueo en la agenda: ends_at + tiempo de limpieza.
  blocked_until timestamptz not null,
  status public.booking_status not null default 'confirmed',
  source public.booking_source not null,
  total_clp integer not null check (total_clp >= 0),
  notes text not null default '' check (char_length(notes) <= 500),
  -- Solo para reservas pendientes de pago: después de esta hora se liberan solas.
  expires_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users (id) on delete set null,
  cancel_reason text check (char_length(cancel_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (blocked_until >= ends_at),
  check ((status = 'cancelled') = (cancelled_at is not null)),
  foreign key (branch_id, business_id) references public.branches (id, business_id),
  foreign key (staff_id, business_id) references public.staff (id, business_id),
  foreign key (customer_id, business_id) references public.customers (id, business_id),
  -- La regla más importante: un profesional no puede tener dos reservas activas que se pisen.
  -- La base de datos la garantiza aunque lleguen dos reservas al mismo tiempo desde dos teléfonos.
  constraint bookings_no_overlap exclude using gist (
    staff_id with =,
    tstzrange(starts_at, blocked_until) with &&
  ) where (status in ('pending', 'confirmed'))
);
create index bookings_business_starts_idx on public.bookings (business_id, starts_at);
create index bookings_staff_starts_idx on public.bookings (staff_id, starts_at);
create index bookings_customer_starts_idx on public.bookings (customer_id, starts_at desc);
create index bookings_pending_expires_idx on public.bookings (expires_at) where status = 'pending';

-- Servicios incluidos en una reserva, con nombre, precio y duración congelados al reservar.
create table public.booking_services (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  position smallint not null check (position >= 0),
  service_id uuid references public.services (id) on delete set null,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  price_clp integer not null check (price_clp >= 0),
  primary key (booking_id, position)
);

-- Historial de cada reserva: quién hizo qué y cuándo.
create table public.booking_events (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  event text not null check (event in ('created', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show', 'expired')),
  actor_id uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index booking_events_booking_idx on public.booking_events (booking_id, created_at);

-- ───────────────────────── Pagos (Fase 2) ─────────────────────────
-- Las tablas existen desde ya para que el modelo esté completo; solo el servidor escribe en ellas.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete set null,
  provider text not null check (provider in ('mercadopago', 'transbank')),
  provider_payment_id text,
  status public.payment_status not null default 'pending',
  amount_clp integer not null check (amount_clp > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index payments_business_idx on public.payments (business_id, created_at desc);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,
  kind public.transaction_kind not null,
  amount_clp integer not null,
  created_at timestamptz not null default now()
);
create index transactions_business_idx on public.transactions (business_id, created_at desc);

-- ───────────────────────── Notificaciones ─────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete cascade,
  channel public.notification_channel not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'queued',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index notifications_queue_idx on public.notifications (scheduled_for) where status = 'queued';

-- ───────────────────────── Planes de PidoHora ─────────────────────────

create table public.plans (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  price_clp integer not null check (price_clp >= 0),
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Plan base acordado: $5.990 al mes, con 3 meses gratis al empezar.
insert into public.plans (id, name, price_clp, features)
values ('base', 'Plan base', 5990, '{"trial_days": 90}'::jsonb);

-- ───────────────────────── Índices de apoyo ─────────────────────────

create index memberships_user_idx on public.memberships (user_id);
create index branches_business_idx on public.branches (business_id);
create index staff_business_idx on public.staff (business_id);
create index services_business_idx on public.services (business_id);
create index staff_services_service_idx on public.staff_services (service_id);
create index opening_hours_branch_idx on public.opening_hours (branch_id, weekday);
create index staff_schedules_staff_idx on public.staff_schedules (staff_id, weekday);
create index time_off_staff_idx on public.time_off (business_id, staff_id, starts_at);
create index customers_business_idx on public.customers (business_id);

-- ───────────────────────── updated_at automático ─────────────────────────

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger businesses_updated_at before update on public.businesses for each row execute function private.set_updated_at();
create trigger branches_updated_at before update on public.branches for each row execute function private.set_updated_at();
create trigger staff_updated_at before update on public.staff for each row execute function private.set_updated_at();
create trigger services_updated_at before update on public.services for each row execute function private.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function private.set_updated_at();
create trigger bookings_updated_at before update on public.bookings for each row execute function private.set_updated_at();
create trigger payments_updated_at before update on public.payments for each row execute function private.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function private.set_updated_at();

-- ───────────────────────── Perfil al registrarse ─────────────────────────

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
