-- PidoHora · Operaciones críticas en el servidor
--
-- Crear un negocio, reservar, mover, cancelar y cambiar el estado de una reserva se hace SOLO con
-- estas funciones. Cada una revisa permisos y reglas, y calcula precios y horarios desde la base
-- de datos: el teléfono o el navegador nunca envían el precio ni la hora de término.
--
-- Los errores que ve la persona tienen mensaje en español y códigos propios:
--   PH001 sin permiso · PH002 dato inválido · PH003 fuera de horario · PH004 hora ocupada
--   PH005 fuera de plazo (anticipación o cancelación) · PH006 no encontrado

-- ───────────────────────── Crear negocio ─────────────────────────

create function public.create_business(
  p_name text,
  p_slug text,
  p_category text,
  p_timezone text default 'America/Santiago'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_business uuid;
  v_trial integer;
begin
  if v_user is null then
    raise exception 'Necesitas iniciar sesión para crear un negocio.' using errcode = 'PH001';
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'Zona horaria desconocida: %', p_timezone using errcode = 'PH002';
  end if;
  -- Límite simple contra abuso: una persona no puede crear decenas de negocios.
  if (select count(*) from public.memberships m where m.user_id = v_user and m.role = 'owner') >= 5 then
    raise exception 'Llegaste al máximo de negocios por cuenta. Escríbenos si necesitas más.' using errcode = 'PH001';
  end if;

  insert into public.businesses (name, slug, category, timezone, created_by)
  values (trim(p_name), lower(trim(p_slug)), p_category, p_timezone, v_user)
  returning id into v_business;

  insert into public.memberships (business_id, user_id, role) values (v_business, v_user, 'owner');
  insert into public.branches (business_id) values (v_business);

  select coalesce((p.features ->> 'trial_days')::integer, 0) into v_trial from public.plans p where p.id = 'base';
  insert into public.subscriptions (business_id, plan_id, status, trial_ends_at)
  values (v_business, 'base', 'trialing', now() + make_interval(days => coalesce(v_trial, 0)));

  return v_business;
exception
  when unique_violation then
    raise exception 'Ese link ya está en uso. Prueba con otro nombre.' using errcode = 'PH002';
  when check_violation then
    raise exception 'Revisa el nombre, el link (solo minúsculas, números y guiones) y el rubro.' using errcode = 'PH002';
end;
$$;

-- ───────────────────────── Validar un horario ─────────────────────────
-- ¿Puede el profesional atender de p_starts a p_blocked_until? Revisa su horario semanal
-- (en la zona horaria del negocio) y los bloqueos. No revisa otras reservas: eso lo garantiza
-- la restricción bookings_no_overlap.

create function private.assert_slot_open(
  p_business_id uuid,
  p_staff_id uuid,
  p_starts timestamptz,
  p_blocked_until timestamptz
) returns uuid -- devuelve la sucursal del tramo
language plpgsql stable security definer set search_path = '' as $$
declare
  v_tz text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_branch uuid;
begin
  select b.timezone into v_tz from public.businesses b where b.id = p_business_id;
  v_local_start := p_starts at time zone v_tz;
  v_local_end := p_blocked_until at time zone v_tz;

  if v_local_end::date <> v_local_start::date and v_local_end::time <> time '00:00' then
    raise exception 'La reserva no puede pasar al día siguiente.' using errcode = 'PH003';
  end if;

  select s.branch_id into v_branch
  from public.staff_schedules s
  where s.staff_id = p_staff_id
    and s.weekday = extract(dow from v_local_start)
    and s.starts <= v_local_start::time
    and (v_local_end::time = time '00:00' or s.ends >= v_local_end::time)
  limit 1;

  if v_branch is null then
    raise exception 'Esa hora está fuera del horario del profesional.' using errcode = 'PH003';
  end if;

  if exists (
    select 1 from public.time_off t
    where t.business_id = p_business_id
      and (t.staff_id = p_staff_id or t.staff_id is null)
      and tstzrange(t.starts_at, t.ends_at) && tstzrange(p_starts, p_blocked_until)
  ) then
    raise exception 'Esa hora está bloqueada (vacaciones, feriado o bloqueo del negocio).' using errcode = 'PH003';
  end if;

  return v_branch;
end;
$$;

-- ───────────────────────── Crear una reserva ─────────────────────────
-- La usan el cliente (desde la app o la web) y el negocio (reserva manual).
-- Requiere sesión: el cliente sin cuenta podrá usar una sesión anónima de Supabase.

create function public.create_booking(
  p_business_id uuid,
  p_staff_id uuid,
  p_service_ids uuid[],
  p_starts_at timestamptz,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_customer_email text default null,
  p_notes text default '',
  p_source public.booking_source default 'app'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_biz public.businesses;
  v_is_desk boolean;
  v_customer uuid;
  v_branch uuid;
  v_duration integer;
  v_buffer integer;
  v_total integer;
  v_count integer;
  v_booking uuid;
begin
  if v_user is null then
    raise exception 'Necesitas iniciar sesión para reservar.' using errcode = 'PH001';
  end if;

  select * into v_biz from public.businesses b where b.id = p_business_id;
  if v_biz.id is null then
    raise exception 'No encontramos el negocio.' using errcode = 'PH006';
  end if;

  v_is_desk := private.is_member(p_business_id);
  if not v_biz.is_published and not v_is_desk then
    raise exception 'No encontramos el negocio.' using errcode = 'PH006';
  end if;
  if p_source = 'manual' and not v_is_desk then
    raise exception 'Solo el negocio puede crear reservas manuales.' using errcode = 'PH001';
  end if;

  if p_service_ids is null or cardinality(p_service_ids) = 0 or cardinality(p_service_ids) > 10 then
    raise exception 'Elige entre 1 y 10 servicios.' using errcode = 'PH002';
  end if;

  if not exists (
    select 1 from public.staff st where st.id = p_staff_id and st.business_id = p_business_id and st.is_active
  ) then
    raise exception 'Ese profesional no está disponible.' using errcode = 'PH006';
  end if;

  -- Duración y precio vienen de la base de datos, con el precio o duración propios del profesional si existen.
  select count(*),
         sum(coalesce(ss.duration_minutes, s.duration_minutes)),
         coalesce(max(s.buffer_minutes), 0),
         sum(coalesce(ss.price_clp, s.price_clp))
    into v_count, v_duration, v_buffer, v_total
  from unnest(p_service_ids) with ordinality as req(service_id, pos)
  join public.services s on s.id = req.service_id and s.business_id = p_business_id and s.is_active
  join public.staff_services ss on ss.service_id = s.id and ss.staff_id = p_staff_id;

  if v_count <> cardinality(p_service_ids) then
    raise exception 'Alguno de los servicios no existe o no lo hace este profesional.' using errcode = 'PH002';
  end if;

  -- Plazos: el negocio puede saltarse la anticipación mínima en reservas manuales, pero no reservar en el pasado.
  if p_starts_at < now() then
    raise exception 'Esa hora ya pasó.' using errcode = 'PH005';
  end if;
  if not v_is_desk and p_starts_at < now() + make_interval(mins => v_biz.min_advance_minutes) then
    raise exception 'Hay que reservar con al menos % minutos de anticipación.', v_biz.min_advance_minutes using errcode = 'PH005';
  end if;
  if p_starts_at > now() + make_interval(days => v_biz.max_advance_days) then
    raise exception 'Solo se puede reservar hasta % días adelante.', v_biz.max_advance_days using errcode = 'PH005';
  end if;

  v_branch := private.assert_slot_open(
    p_business_id, p_staff_id, p_starts_at,
    p_starts_at + make_interval(mins => v_duration + v_buffer)
  );

  -- Ficha del cliente dentro del negocio.
  if v_is_desk and p_source = 'manual' then
    if coalesce(trim(p_customer_name), '') = '' then
      raise exception 'Escribe el nombre del cliente.' using errcode = 'PH002';
    end if;
    if p_customer_phone is not null then
      select c.id into v_customer from public.customers c
      where c.business_id = p_business_id and c.phone = p_customer_phone;
    end if;
    if v_customer is null then
      insert into public.customers (business_id, full_name, phone, email)
      values (p_business_id, trim(p_customer_name), p_customer_phone, p_customer_email)
      returning id into v_customer;
    end if;
  else
    -- Límite contra reservas falsas: máximo 3 horas futuras activas por persona en un mismo negocio.
    select count(*) into v_count
    from public.bookings bk join public.customers c on c.id = bk.customer_id
    where c.user_id = v_user and bk.business_id = p_business_id
      and bk.status in ('pending', 'confirmed') and bk.starts_at > now();
    if v_count >= 3 then
      raise exception 'Ya tienes 3 horas reservadas en este negocio. Cancela una para tomar otra.' using errcode = 'PH005';
    end if;

    select c.id into v_customer from public.customers c
    where c.business_id = p_business_id and c.user_id = v_user;
    if v_customer is null then
      if coalesce(trim(p_customer_name), '') = '' then
        raise exception 'Escribe tu nombre para reservar.' using errcode = 'PH002';
      end if;
      insert into public.customers (business_id, user_id, full_name, phone, email)
      values (p_business_id, v_user, trim(p_customer_name), p_customer_phone, p_customer_email)
      returning id into v_customer;
    end if;
  end if;

  insert into public.bookings (
    business_id, branch_id, staff_id, customer_id, starts_at, ends_at, blocked_until,
    status, source, total_clp, notes, created_by
  ) values (
    p_business_id, v_branch, p_staff_id, v_customer, p_starts_at,
    p_starts_at + make_interval(mins => v_duration),
    p_starts_at + make_interval(mins => v_duration + v_buffer),
    'confirmed', p_source, v_total, left(coalesce(p_notes, ''), 500), v_user
  ) returning id into v_booking;

  insert into public.booking_services (booking_id, position, service_id, name, duration_minutes, buffer_minutes, price_clp)
  select v_booking, (req.pos - 1)::smallint, s.id, s.name,
         coalesce(ss.duration_minutes, s.duration_minutes), s.buffer_minutes, coalesce(ss.price_clp, s.price_clp)
  from unnest(p_service_ids) with ordinality as req(service_id, pos)
  join public.services s on s.id = req.service_id
  join public.staff_services ss on ss.service_id = s.id and ss.staff_id = p_staff_id;

  insert into public.booking_events (booking_id, business_id, event, actor_id, details)
  values (v_booking, p_business_id, 'created', v_user, jsonb_build_object('source', p_source, 'total_clp', v_total));

  return v_booking;
exception
  when exclusion_violation then
    raise exception 'Esa hora ya no está disponible. Elige otra.' using errcode = 'PH004';
end;
$$;

-- ───────────────────────── Permiso sobre una reserva existente ─────────────────────────
-- 'desk' = recepción, admin o dueño · 'staff' = el profesional de esa reserva · 'customer' = el cliente.

create function private.booking_actor(p_booking public.bookings)
returns text
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.is_front_desk(p_booking.business_id) then
    return 'desk';
  end if;
  if exists (
    select 1 from public.staff st
    where st.id = p_booking.staff_id and st.user_id = auth.uid() and auth.uid() is not null
  ) and private.is_member(p_booking.business_id) then
    return 'staff';
  end if;
  if private.is_own_customer(p_booking.customer_id) then
    return 'customer';
  end if;
  return null;
end;
$$;

-- ───────────────────────── Cancelar ─────────────────────────

create function public.cancel_booking(p_booking_id uuid, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_actor text;
  v_window integer;
begin
  select * into v_booking from public.bookings b where b.id = p_booking_id for update;
  v_actor := case when v_booking.id is null then null else private.booking_actor(v_booking) end;
  if v_actor is null then
    raise exception 'No encontramos la reserva.' using errcode = 'PH006';
  end if;
  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'Esta reserva ya no se puede cancelar.' using errcode = 'PH002';
  end if;
  if v_actor = 'customer' then
    select b.cancellation_window_minutes into v_window from public.businesses b where b.id = v_booking.business_id;
    if v_booking.starts_at < now() + make_interval(mins => v_window) then
      raise exception 'Ya no puedes cancelar: el negocio permite cancelar hasta % minutos antes. Escríbele directamente.', v_window
        using errcode = 'PH005';
    end if;
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(),
         cancel_reason = left(p_reason, 300)
   where id = p_booking_id;

  insert into public.booking_events (booking_id, business_id, event, actor_id, details)
  values (p_booking_id, v_booking.business_id, 'cancelled', auth.uid(),
          jsonb_build_object('by', v_actor, 'reason', left(p_reason, 300)));
end;
$$;

-- ───────────────────────── Mover a otra hora ─────────────────────────
-- Misma reserva, mismo profesional y servicios; la duración se toma de lo que se reservó.

create function public.reschedule_booking(p_booking_id uuid, p_new_starts_at timestamptz)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_biz public.businesses;
  v_actor text;
  v_duration integer;
  v_buffer integer;
  v_branch uuid;
begin
  select * into v_booking from public.bookings b where b.id = p_booking_id for update;
  v_actor := case when v_booking.id is null then null else private.booking_actor(v_booking) end;
  if v_actor is null then
    raise exception 'No encontramos la reserva.' using errcode = 'PH006';
  end if;
  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'Esta reserva ya no se puede mover.' using errcode = 'PH002';
  end if;

  select * into v_biz from public.businesses b where b.id = v_booking.business_id;

  if p_new_starts_at < now() then
    raise exception 'Esa hora ya pasó.' using errcode = 'PH005';
  end if;
  if v_actor = 'customer' then
    if v_booking.starts_at < now() + make_interval(mins => v_biz.cancellation_window_minutes) then
      raise exception 'Ya no puedes mover esta hora: el negocio permite cambios hasta % minutos antes.', v_biz.cancellation_window_minutes
        using errcode = 'PH005';
    end if;
    if p_new_starts_at < now() + make_interval(mins => v_biz.min_advance_minutes) then
      raise exception 'Hay que reservar con al menos % minutos de anticipación.', v_biz.min_advance_minutes using errcode = 'PH005';
    end if;
    if p_new_starts_at > now() + make_interval(days => v_biz.max_advance_days) then
      raise exception 'Solo se puede reservar hasta % días adelante.', v_biz.max_advance_days using errcode = 'PH005';
    end if;
  end if;

  select sum(bs.duration_minutes), coalesce(max(bs.buffer_minutes), 0)
    into v_duration, v_buffer
  from public.booking_services bs where bs.booking_id = p_booking_id;

  v_branch := private.assert_slot_open(
    v_booking.business_id, v_booking.staff_id, p_new_starts_at,
    p_new_starts_at + make_interval(mins => v_duration + v_buffer)
  );

  update public.bookings
     set starts_at = p_new_starts_at,
         ends_at = p_new_starts_at + make_interval(mins => v_duration),
         blocked_until = p_new_starts_at + make_interval(mins => v_duration + v_buffer),
         branch_id = v_branch
   where id = p_booking_id;

  insert into public.booking_events (booking_id, business_id, event, actor_id, details)
  values (p_booking_id, v_booking.business_id, 'rescheduled', auth.uid(),
          jsonb_build_object('by', v_actor, 'from', v_booking.starts_at, 'to', p_new_starts_at));
exception
  when exclusion_violation then
    raise exception 'Esa hora ya no está disponible. Elige otra.' using errcode = 'PH004';
end;
$$;

-- ───────────────────────── Asistencia ─────────────────────────
-- El negocio (o el profesional de la cita) marca si el cliente vino o no.

create function public.set_booking_status(p_booking_id uuid, p_status public.booking_status)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_actor text;
begin
  if p_status not in ('completed', 'no_show') then
    raise exception 'Usa cancel_booking para cancelar y reschedule_booking para mover.' using errcode = 'PH002';
  end if;
  select * into v_booking from public.bookings b where b.id = p_booking_id for update;
  v_actor := case when v_booking.id is null then null else private.booking_actor(v_booking) end;
  if v_actor is null or v_actor = 'customer' then
    raise exception 'No encontramos la reserva.' using errcode = 'PH006';
  end if;
  if v_booking.status <> 'confirmed' then
    raise exception 'Solo se puede marcar la asistencia de una reserva confirmada.' using errcode = 'PH002';
  end if;
  if v_booking.starts_at > now() then
    raise exception 'La asistencia se marca cuando llega la hora.' using errcode = 'PH005';
  end if;

  update public.bookings set status = p_status where id = p_booking_id;
  insert into public.booking_events (booking_id, business_id, event, actor_id, details)
  values (p_booking_id, v_booking.business_id, p_status::text, auth.uid(), jsonb_build_object('by', v_actor));
end;
$$;

-- ───────────────────────── Horas ocupadas (para calcular horas libres) ─────────────────────────
-- Devuelve solo intervalos, sin nombres ni datos de clientes, para que el público pueda ver
-- disponibilidad sin ver reservas ajenas.

create function public.busy_intervals(
  p_business_id uuid,
  p_from timestamptz,
  p_to timestamptz
) returns table (staff_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select bk.staff_id, bk.starts_at, bk.blocked_until
  from public.bookings bk
  where bk.business_id = p_business_id
    and (private.is_published(p_business_id) or private.is_member(p_business_id))
    and bk.status in ('pending', 'confirmed')
    and bk.starts_at < p_to and bk.blocked_until > p_from
    and p_to - p_from <= interval '62 days'
  union all
  select coalesce(t.staff_id, st.id), t.starts_at, t.ends_at
  from public.time_off t
  join public.staff st on st.business_id = t.business_id and (t.staff_id is null or st.id = t.staff_id)
  where t.business_id = p_business_id
    and (private.is_published(p_business_id) or private.is_member(p_business_id))
    and t.starts_at < p_to and t.ends_at > p_from
    and p_to - p_from <= interval '62 days';
$$;

-- ───────────────────────── Liberar reservas pendientes vencidas ─────────────────────────
-- Para cuando existan pagos (Fase 2): una reserva pendiente de pago se libera si vence.
-- Se programa con pg_cron cada 5 minutos (ver docs/base-de-datos.md).

create function private.expire_pending_bookings()
returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  with expired as (
    update public.bookings
       set status = 'cancelled', cancelled_at = now(), cancel_reason = 'Venció el plazo de pago'
     where status = 'pending' and expires_at is not null and expires_at < now()
    returning id, business_id
  ), logged as (
    insert into public.booking_events (booking_id, business_id, event)
    select id, business_id, 'expired' from expired
    returning 1
  )
  select count(*) into v_count from logged;
  return v_count;
end;
$$;

-- ───────────────────────── Quién puede llamar a cada función ─────────────────────────

revoke all on function public.create_business(text, text, text, text) from public, anon;
revoke all on function public.create_booking(uuid, uuid, uuid[], timestamptz, text, text, text, text, public.booking_source) from public, anon;
revoke all on function public.cancel_booking(uuid, text) from public, anon;
revoke all on function public.reschedule_booking(uuid, timestamptz) from public, anon;
revoke all on function public.set_booking_status(uuid, public.booking_status) from public, anon;
revoke all on function public.busy_intervals(uuid, timestamptz, timestamptz) from public;
revoke all on function private.assert_slot_open(uuid, uuid, timestamptz, timestamptz) from public;
revoke all on function private.booking_actor(public.bookings) from public;
revoke all on function private.expire_pending_bookings() from public;

grant execute on function public.create_business(text, text, text, text) to authenticated;
grant execute on function public.create_booking(uuid, uuid, uuid[], timestamptz, text, text, text, text, public.booking_source) to authenticated;
grant execute on function public.cancel_booking(uuid, text) to authenticated;
grant execute on function public.reschedule_booking(uuid, timestamptz) to authenticated;
grant execute on function public.set_booking_status(uuid, public.booking_status) to authenticated;
grant execute on function public.busy_intervals(uuid, timestamptz, timestamptz) to anon, authenticated;
