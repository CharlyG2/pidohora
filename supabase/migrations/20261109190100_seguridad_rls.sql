-- PidoHora · Seguridad: Row Level Security (RLS)
--
-- RLS es un filtro que la base de datos aplica a cada consulta, venga de la app, de la web o de
-- cualquiera que tenga la llave pública. Regla general:
--   * Público (sin cuenta): solo ve negocios publicados y su información de vitrina.
--   * Miembros de un negocio: ven y administran solo los datos de su negocio, según su rol.
--   * Clientes con cuenta: ven sus propias reservas y su perfil.
--   * Reservas, pagos y notificaciones NO se escriben directo: solo mediante funciones del servidor
--     (ver la migración de reservas) o Edge Functions con la llave de servidor.

-- ───────────────────────── Funciones de ayuda ─────────────────────────
-- security definer: leen memberships sin pasar por su propia política (evita recursión).

create function private.has_role(p_business_id uuid, p_roles public.member_role[])
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

create function private.is_member(p_business_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role(p_business_id, array['owner', 'admin', 'reception', 'staff']::public.member_role[]);
$$;

create function private.is_manager(p_business_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role(p_business_id, array['owner', 'admin']::public.member_role[]);
$$;

create function private.is_front_desk(p_business_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role(p_business_id, array['owner', 'admin', 'reception']::public.member_role[]);
$$;

create function private.is_published(p_business_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select b.is_published from public.businesses b where b.id = p_business_id), false);
$$;

-- ¿La reserva es de una ficha de cliente que pertenece al usuario actual?
create function private.is_own_customer(p_customer_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.user_id = auth.uid() and auth.uid() is not null
  );
$$;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
revoke all on all functions in schema private from public;
grant execute on function
  private.has_role(uuid, public.member_role[]),
  private.is_member(uuid),
  private.is_manager(uuid),
  private.is_front_desk(uuid),
  private.is_published(uuid),
  private.is_own_customer(uuid)
to anon, authenticated;

-- ───────────────────────── Activar RLS en todas las tablas ─────────────────────────

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.memberships enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.staff_services enable row level security;
alter table public.opening_hours enable row level security;
alter table public.staff_schedules enable row level security;
alter table public.time_off enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_services enable row level security;
alter table public.booking_events enable row level security;
alter table public.payments enable row level security;
alter table public.transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

-- ───────────────────────── Perfiles ─────────────────────────

create policy "cada persona ve su perfil" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "cada persona edita su perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ───────────────────────── Negocios ─────────────────────────
-- Los negocios se crean con la función create_business (crea también al dueño y la sucursal).

create policy "público ve negocios publicados; miembros ven el suyo" on public.businesses
  for select to anon, authenticated using (is_published or private.is_member(id));
create policy "dueño y admin editan el negocio" on public.businesses
  for update to authenticated using (private.is_manager(id)) with check (private.is_manager(id));

-- ───────────────────────── Vitrina: sucursales, equipo, servicios, horarios ─────────────────────────

create policy "ver sucursales" on public.branches
  for select to anon, authenticated using (private.is_published(business_id) or private.is_member(business_id));
create policy "dueño y admin crean sucursales" on public.branches
  for insert to authenticated with check (private.is_manager(business_id));
create policy "dueño y admin editan sucursales" on public.branches
  for update to authenticated using (private.is_manager(business_id)) with check (private.is_manager(business_id));
create policy "dueño y admin borran sucursales" on public.branches
  for delete to authenticated using (private.is_manager(business_id));

create policy "ver equipo" on public.staff
  for select to anon, authenticated using (private.is_published(business_id) or private.is_member(business_id));
create policy "dueño y admin crean profesionales" on public.staff
  for insert to authenticated with check (private.is_manager(business_id));
create policy "dueño y admin editan profesionales" on public.staff
  for update to authenticated using (private.is_manager(business_id)) with check (private.is_manager(business_id));
create policy "dueño y admin borran profesionales" on public.staff
  for delete to authenticated using (private.is_manager(business_id));

create policy "ver servicios" on public.services
  for select to anon, authenticated using (private.is_published(business_id) or private.is_member(business_id));
create policy "dueño y admin crean servicios" on public.services
  for insert to authenticated with check (private.is_manager(business_id));
create policy "dueño y admin editan servicios" on public.services
  for update to authenticated using (private.is_manager(business_id)) with check (private.is_manager(business_id));
create policy "dueño y admin borran servicios" on public.services
  for delete to authenticated using (private.is_manager(business_id));

create policy "ver qué hace cada profesional" on public.staff_services
  for select to anon, authenticated using (private.is_published(business_id) or private.is_member(business_id));
create policy "dueño y admin asignan servicios" on public.staff_services
  for insert to authenticated with check (private.is_manager(business_id));
create policy "dueño y admin editan asignaciones" on public.staff_services
  for update to authenticated using (private.is_manager(business_id)) with check (private.is_manager(business_id));
create policy "dueño y admin quitan asignaciones" on public.staff_services
  for delete to authenticated using (private.is_manager(business_id));

create policy "ver horario de atención" on public.opening_hours
  for select to anon, authenticated using (private.is_published(business_id) or private.is_member(business_id));
create policy "dueño y admin crean horario" on public.opening_hours
  for insert to authenticated with check (private.is_manager(business_id));
create policy "dueño y admin editan horario" on public.opening_hours
  for update to authenticated using (private.is_manager(business_id)) with check (private.is_manager(business_id));
create policy "dueño y admin borran horario" on public.opening_hours
  for delete to authenticated using (private.is_manager(business_id));

create policy "ver horario de profesionales" on public.staff_schedules
  for select to anon, authenticated using (private.is_published(business_id) or private.is_member(business_id));
create policy "dueño y admin crean horarios de profesionales" on public.staff_schedules
  for insert to authenticated with check (private.is_manager(business_id));
create policy "dueño y admin editan horarios de profesionales" on public.staff_schedules
  for update to authenticated using (private.is_manager(business_id)) with check (private.is_manager(business_id));
create policy "dueño y admin borran horarios de profesionales" on public.staff_schedules
  for delete to authenticated using (private.is_manager(business_id));

-- Los bloqueos pueden tener motivos privados: el público no los ve (las horas libres se calculan en el servidor).
create policy "miembros ven bloqueos" on public.time_off
  for select to authenticated using (private.is_member(business_id));
create policy "recepción, admin y dueño crean bloqueos" on public.time_off
  for insert to authenticated with check (private.is_front_desk(business_id));
create policy "recepción, admin y dueño editan bloqueos" on public.time_off
  for update to authenticated using (private.is_front_desk(business_id)) with check (private.is_front_desk(business_id));
create policy "recepción, admin y dueño borran bloqueos" on public.time_off
  for delete to authenticated using (private.is_front_desk(business_id));

-- ───────────────────────── Miembros del negocio ─────────────────────────

create policy "cada persona ve sus membresías; dueño y admin ven el equipo" on public.memberships
  for select to authenticated using (user_id = auth.uid() or private.is_manager(business_id));
create policy "solo el dueño agrega miembros" on public.memberships
  for insert to authenticated with check (private.has_role(business_id, array['owner']::public.member_role[]));
create policy "solo el dueño cambia roles" on public.memberships
  for update to authenticated
  using (private.has_role(business_id, array['owner']::public.member_role[]))
  with check (private.has_role(business_id, array['owner']::public.member_role[]));
create policy "solo el dueño quita miembros" on public.memberships
  for delete to authenticated using (private.has_role(business_id, array['owner']::public.member_role[]));

-- Un negocio nunca se queda sin dueño.
create function private.keep_one_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and exists (select 1 from public.businesses b where b.id = old.business_id)
     and not exists (
       select 1 from public.memberships m
       where m.business_id = old.business_id and m.role = 'owner' and m.user_id <> old.user_id
     ) then
    raise exception 'El negocio debe tener al menos un dueño.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger memberships_keep_one_owner
  before update or delete on public.memberships
  for each row execute function private.keep_one_owner();

-- ───────────────────────── Clientes ─────────────────────────

create policy "el negocio ve sus clientes; cada persona ve sus fichas" on public.customers
  for select to authenticated using (private.is_member(business_id) or user_id = auth.uid());
create policy "el negocio crea clientes" on public.customers
  for insert to authenticated with check (private.is_member(business_id));
create policy "el negocio edita clientes" on public.customers
  for update to authenticated using (private.is_member(business_id)) with check (private.is_member(business_id));
create policy "dueño y admin borran clientes" on public.customers
  for delete to authenticated using (private.is_manager(business_id));

-- ───────────────────────── Reservas ─────────────────────────
-- Sin políticas de escritura: crear, mover y cancelar se hace solo con las funciones del servidor.

create policy "el negocio ve sus reservas; el cliente ve las suyas" on public.bookings
  for select to authenticated using (private.is_member(business_id) or private.is_own_customer(customer_id));

create policy "ver servicios de reservas visibles" on public.booking_services
  for select to authenticated using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (private.is_member(b.business_id) or private.is_own_customer(b.customer_id))
    )
  );

create policy "el negocio ve el historial de sus reservas" on public.booking_events
  for select to authenticated using (private.is_member(business_id));

-- ───────────────────────── Dinero y avisos: solo lectura para dueño y admin ─────────────────────────

create policy "dueño y admin ven pagos" on public.payments
  for select to authenticated using (private.is_manager(business_id));
create policy "dueño y admin ven transacciones" on public.transactions
  for select to authenticated using (private.is_manager(business_id));
create policy "dueño y admin ven notificaciones" on public.notifications
  for select to authenticated using (private.is_manager(business_id));

-- ───────────────────────── Planes y suscripciones ─────────────────────────

create policy "todos ven los planes activos" on public.plans
  for select to anon, authenticated using (is_active);
create policy "dueño y admin ven la suscripción" on public.subscriptions
  for select to authenticated using (private.is_manager(business_id));

-- ───────────────────────── Permisos de tabla ─────────────────────────
-- Además de RLS, quitamos lo que ningún rol de cliente debe poder hacer nunca.

revoke insert, update, delete on public.bookings, public.booking_services, public.booking_events,
  public.payments, public.transactions, public.notifications, public.plans, public.subscriptions
  from anon, authenticated;
revoke insert, delete on public.businesses, public.profiles from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;
-- El público (sin cuenta) ni siquiera puede consultar las tablas con datos privados.
revoke select on public.profiles, public.memberships, public.time_off, public.customers, public.bookings,
  public.booking_services, public.booking_events, public.payments, public.transactions,
  public.notifications, public.subscriptions
  from anon;
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
