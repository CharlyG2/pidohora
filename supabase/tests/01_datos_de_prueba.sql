-- Datos SOLO para las pruebas automáticas (se crean en una base de datos temporal y se borran).

create schema tests;
grant usage on schema tests to anon, authenticated;

-- Actúa como un usuario (o como público si p_user es null) hasta el final de la transacción.
create function tests.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_user::text, ''), true);
  if p_user is null then
    execute 'set local role anon';
  else
    execute 'set local role authenticated';
  end if;
end $$;

-- Ejecuta SQL y verifica que falle con el código esperado.
create function tests.expect_error(p_sql text, p_code text, p_label text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlstate <> p_code then
      raise exception 'FALLA [%]: se esperaba error %, llegó % (%)', p_label, p_code, sqlstate, sqlerrm;
    end if;
    raise notice 'ok  %', p_label;
    return;
  end;
  raise exception 'FALLA [%]: se esperaba error %, pero funcionó', p_label, p_code;
end $$;

create function tests.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if p_ok is not true then
    raise exception 'FALLA [%]', p_label;
  end if;
  raise notice 'ok  %', p_label;
end $$;

-- Lunes de la próxima semana a la hora local indicada (Santiago).
create function tests.next_monday(p_time time) returns timestamptz language sql stable as $$
  select (((date_trunc('week', now() at time zone 'America/Santiago'))::date + 7) + p_time) at time zone 'America/Santiago'
$$;

-- Id de la reserva activa de un cliente con un profesional, vista "desde afuera" (sin RLS),
-- para probar que otra persona no puede tocarla aunque conozca su id.
create function tests.booking_id(p_customer text, p_staff text) returns uuid
language sql stable security definer set search_path = '' as $$
  select b.id from public.bookings b
  join public.customers c on c.id = b.customer_id
  join public.staff s on s.id = b.staff_id
  where c.full_name = p_customer and s.display_name = p_staff
  order by (b.status in ('pending', 'confirmed')) desc, b.created_at desc
  limit 1
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- Personas: dueña del negocio A, dueño del negocio B, recepcionista de A, profesional de A, dos clientes.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'duena.a@prueba.test', '{"full_name":"Dueña A"}'),
  ('b0000000-0000-0000-0000-000000000001', 'dueno.b@prueba.test', '{"full_name":"Dueño B"}'),
  ('a0000000-0000-0000-0000-000000000002', 'recepcion.a@prueba.test', '{"full_name":"Recepción A"}'),
  ('a0000000-0000-0000-0000-000000000003', 'pro.a@prueba.test', '{"full_name":"Profesional A"}'),
  ('c0000000-0000-0000-0000-000000000001', 'cliente.1@prueba.test', '{"full_name":"Cliente Uno"}'),
  ('c0000000-0000-0000-0000-000000000002', 'cliente.2@prueba.test', '{"full_name":"Cliente Dos"}');
