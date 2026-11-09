-- Pruebas de la base de datos de PidoHora.
-- Cada bloque actúa como una persona distinta (tests.act_as) y verifica lo que puede y no puede hacer.
-- Si algo falla, el script se detiene con "FALLA [...]".

\set ON_ERROR_STOP on
\set QUIET on
set client_min_messages = notice;

\warn '— 1. Crear negocios y configurarlos (como sus dueños)'

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000001');
select public.create_business('Barbería Prueba A', 'barberia-prueba-a', 'barberia');
insert into public.staff (business_id, user_id, display_name, role_title)
  select id, 'a0000000-0000-0000-0000-000000000003', 'Ana', 'Barbera' from public.businesses where slug = 'barberia-prueba-a';
insert into public.staff (business_id, display_name, role_title)
  select id, 'Beto', 'Barbero' from public.businesses where slug = 'barberia-prueba-a';
insert into public.services (business_id, name, duration_minutes, price_clp)
  select id, 'Corte', 30, 10000 from public.businesses where slug = 'barberia-prueba-a';
insert into public.services (business_id, name, duration_minutes, buffer_minutes, price_clp)
  select id, 'Barba', 20, 10, 8000 from public.businesses where slug = 'barberia-prueba-a';
insert into public.services (business_id, name, duration_minutes, price_clp)
  select id, 'Tintura', 60, 25000 from public.businesses where slug = 'barberia-prueba-a';
-- Ana hace corte y barba (la barba más cara con ella); Beto solo corte. Nadie hace tintura todavía.
insert into public.staff_services (business_id, staff_id, service_id, price_clp)
  select st.business_id, st.id, s.id, case when s.name = 'Barba' then 9000 end
  from public.staff st join public.services s on s.business_id = st.business_id
  where st.display_name = 'Ana' and s.name in ('Corte', 'Barba');
insert into public.staff_services (business_id, staff_id, service_id)
  select st.business_id, st.id, s.id
  from public.staff st join public.services s on s.business_id = st.business_id
  where st.display_name = 'Beto' and s.name = 'Corte';
-- Lunes: 10:00–14:00 y 15:00–19:00 para los dos.
insert into public.staff_schedules (business_id, staff_id, branch_id, weekday, starts, ends)
  select st.business_id, st.id, br.id, 1, t.s, t.e
  from public.staff st join public.branches br on br.business_id = st.business_id
  cross join (values (time '10:00', time '14:00'), (time '15:00', time '19:00')) as t(s, e);
insert into public.memberships (business_id, user_id, role)
  select id, 'a0000000-0000-0000-0000-000000000002', 'reception' from public.businesses where slug = 'barberia-prueba-a';
insert into public.memberships (business_id, user_id, role)
  select id, 'a0000000-0000-0000-0000-000000000003', 'staff' from public.businesses where slug = 'barberia-prueba-a';
update public.businesses set is_published = true where slug = 'barberia-prueba-a';
select tests.check((select count(*) from public.staff) = 2, 'la dueña A ve su equipo');
select tests.check((select status from public.subscriptions) = 'trialing', 'el negocio nuevo parte con prueba gratis');
select tests.check(
  (select trial_ends_at::date from public.subscriptions) = (now() + interval '90 days')::date,
  'la prueba gratis dura 90 días');
select tests.expect_error(
  $$select public.create_business('Otro', 'barberia-prueba-a', 'barberia')$$, 'PH002', 'no se puede repetir el link de otro negocio');
commit;

begin;
select tests.act_as('b0000000-0000-0000-0000-000000000001');
select public.create_business('Peluquería Prueba B', 'peluqueria-prueba-b', 'peluqueria');
insert into public.services (business_id, name, duration_minutes, price_clp)
  select id, 'Brushing', 45, 15000 from public.businesses where slug = 'peluqueria-prueba-b';
insert into public.customers (business_id, full_name, phone)
  select id, 'Clienta secreta de B', '+56911112222' from public.businesses where slug = 'peluqueria-prueba-b';
commit;

\warn '— 2. Aislamiento entre negocios'

begin;
select tests.act_as('b0000000-0000-0000-0000-000000000001');
select tests.check((select count(*) from public.businesses where slug = 'barberia-prueba-a') = 1, 'B ve la vitrina de A porque está publicado');
select tests.check((select count(*) from public.memberships where business_id = (select id from public.businesses where slug = 'barberia-prueba-a')) = 0, 'B no ve el equipo interno (membresías) de A');
select tests.check((select count(*) from public.subscriptions) = 1, 'B solo ve su propia suscripción');
with u as (update public.services set price_clp = 1 where business_id = (select id from public.businesses where slug = 'barberia-prueba-a') returning 1)
  select tests.check((select count(*) from u) = 0, 'B no puede cambiar precios de A');
with d as (delete from public.staff where business_id = (select id from public.businesses where slug = 'barberia-prueba-a') returning 1)
  select tests.check((select count(*) from d) = 0, 'B no puede borrar profesionales de A');
select tests.expect_error(
  $$insert into public.staff (business_id, display_name) select id, 'Intruso' from public.businesses where slug = 'barberia-prueba-a'$$,
  '42501', 'B no puede agregar profesionales a A');
select tests.expect_error(
  $$insert into public.memberships (business_id, user_id, role) select id, 'b0000000-0000-0000-0000-000000000001', 'owner' from public.businesses where slug = 'barberia-prueba-a'$$,
  '42501', 'B no puede hacerse dueño de A');
select tests.expect_error(
  $$insert into public.bookings (business_id, branch_id, staff_id, customer_id, starts_at, ends_at, blocked_until, source, total_clp) values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), now(), now() + interval '1 hour', now() + interval '1 hour', 'app', 0)$$,
  '42501', 'nadie puede escribir reservas directo en la tabla');
rollback;

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000001');
select tests.check((select count(*) from public.customers) = 0, 'A no ve los clientes de B');
select tests.check((select count(*) from public.businesses where slug = 'peluqueria-prueba-b') = 0, 'A no ve el negocio B (no publicado)');
rollback;

\warn '— 3. Público sin cuenta'

begin;
select tests.act_as(null);
select tests.check((select count(*) from public.businesses) = 1, 'el público solo ve negocios publicados');
select tests.check((select count(*) from public.services) = 3, 'el público ve los servicios del negocio publicado');
select tests.check((select count(*) from public.plans) = 1, 'el público ve los planes');
select tests.expect_error($$select count(*) from public.customers$$, '42501', 'el público no puede leer clientes');
select tests.expect_error($$select count(*) from public.bookings$$, '42501', 'el público no puede leer reservas');
select tests.expect_error(
  $$select public.create_booking((select id from public.businesses limit 1), gen_random_uuid(), array[gen_random_uuid()], now() + interval '1 day')$$,
  '42501', 'el público no puede reservar sin sesión');
select tests.expect_error(
  $$update public.businesses set name = 'Hackeado'$$, '42501', 'el público no puede editar negocios');
rollback;

\warn '— 4. Reservar'

begin;
select tests.act_as('c0000000-0000-0000-0000-000000000001');
select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Ana'),
  array[(select id from public.services where name = 'Corte'), (select id from public.services where name = 'Barba')],
  tests.next_monday('11:00'),
  'Cliente Uno', '+56912345678');
select tests.check((select total_clp from public.bookings) = 19000, 'el precio lo calcula el servidor (con el precio propio de Ana para la barba)');
select tests.check((select ends_at - starts_at from public.bookings) = interval '50 minutes', 'la hora termina según la duración de los servicios');
select tests.check((select blocked_until - starts_at from public.bookings) = interval '60 minutes', 'la agenda queda bloqueada con el tiempo de limpieza');
select tests.check((select count(*) from public.booking_services) = 2, 'la reserva guarda sus servicios');
select tests.check((select count(*) from public.customers) = 1, 'se creó la ficha del cliente en ese negocio');
commit;

begin;
select tests.act_as('c0000000-0000-0000-0000-000000000002');
select tests.check((select count(*) from public.bookings) = 0, 'un cliente no ve reservas de otro');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Ana'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('11:30'), 'Cliente Dos')$$, 'PH004', 'no se puede tomar una hora que se pisa con otra (incluye limpieza)');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Ana'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('14:00'), 'Cliente Dos')$$, 'PH003', 'no se puede reservar en la colación');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Ana'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('18:45'), 'Cliente Dos')$$, 'PH003', 'no se puede reservar si termina después del cierre');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Ana'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('11:00') + interval '1 day', 'Cliente Dos')$$, 'PH003', 'no se puede reservar un día que no atiende');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Beto'),
  array[(select id from public.services where name = 'Barba')],
  tests.next_monday('11:00'), 'Cliente Dos')$$, 'PH002', 'no se puede pedir un servicio que el profesional no hace');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Beto'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('11:00'), 'Cliente Dos', null, null, '', 'manual')$$, 'PH001', 'un cliente no puede crear reservas manuales');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'peluqueria-prueba-b'),
  gen_random_uuid(), array[gen_random_uuid()], tests.next_monday('11:00'), 'Cliente Dos')$$, 'PH006', 'no se puede reservar en un negocio no publicado');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Beto'),
  array[(select id from public.services where name = 'Corte')],
  now() + interval '10 minutes', 'Cliente Dos')$$, 'PH005', 'se respeta la anticipación mínima');
-- Otro profesional a la misma hora sí se puede.
select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Beto'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('11:00'), 'Cliente Dos');
select tests.check((select count(*) from public.bookings) = 1, 'otro profesional sí puede atender a la misma hora');
commit;

\warn '— 5. Lo que ve cada uno'

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000002');
select tests.check((select count(*) from public.bookings) = 2, 'recepción ve toda la agenda de su negocio');
select tests.check((select count(*) from public.payments) = 0, 'recepción no ve pagos');
rollback;

begin;
select tests.act_as(null);
select tests.check(
  (select count(*) from public.busy_intervals((select id from public.businesses where slug = 'barberia-prueba-a'), now(), now() + interval '14 days')) = 2,
  'el público ve las horas ocupadas (sin datos de clientes)');
rollback;

begin;
select tests.act_as('b0000000-0000-0000-0000-000000000001');
select tests.check(
  (select count(*) from public.bookings) = 0, 'B no ve reservas de A');
select tests.expect_error(
  $$select public.cancel_booking(tests.booking_id('Cliente Uno', 'Ana'))$$, 'PH006', 'B no puede cancelar reservas de A aunque conozca su id');
rollback;

\warn '— 6. Mover y cancelar'

begin;
select tests.act_as('c0000000-0000-0000-0000-000000000001');
select tests.expect_error(
  $$select public.reschedule_booking((select id from public.bookings), tests.next_monday('13:45'))$$, 'PH003', 'no se puede mover a una hora que cruza la colación');
select public.reschedule_booking((select id from public.bookings), tests.next_monday('16:00'));
select tests.check((select starts_at from public.bookings) = tests.next_monday('16:00'), 'el cliente mueve su hora');
select tests.check((select ends_at - starts_at from public.bookings) = interval '50 minutes', 'al mover se mantiene la duración');
commit;

begin;
select tests.act_as('c0000000-0000-0000-0000-000000000002');
select tests.expect_error(
  $$select public.reschedule_booking(tests.booking_id('Cliente Uno', 'Ana'), tests.next_monday('16:30'))$$, 'PH006', 'el cliente 2 no puede mover la hora del cliente 1 aunque conozca su id');
rollback;

-- La dueña amplía el plazo de cancelación a 30 días: ahora el cliente ya no puede cancelar.
begin;
select tests.act_as('a0000000-0000-0000-0000-000000000001');
update public.businesses set cancellation_window_minutes = 43200 where slug = 'barberia-prueba-a';
commit;

begin;
select tests.act_as('c0000000-0000-0000-0000-000000000001');
select tests.expect_error(
  $$select public.cancel_booking((select id from public.bookings), 'No puedo')$$, 'PH005', 'el cliente no cancela fuera de plazo');
rollback;

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000002');
select public.cancel_booking(tests.booking_id('Cliente Uno', 'Ana'), 'Pidió por teléfono');
select tests.check(
  (select status from public.bookings b join public.customers c on c.id = b.customer_id where c.full_name = 'Cliente Uno') = 'cancelled',
  'recepción sí cancela fuera de plazo');
select tests.check(
  (select count(*) from public.booking_events where event in ('created', 'rescheduled', 'cancelled')) = 4,
  'queda el historial: 2 creadas, 1 movida, 1 cancelada');
commit;

begin;
select tests.act_as('c0000000-0000-0000-0000-000000000002');
-- La hora cancelada quedó libre: otro cliente la puede tomar.
select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Ana'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('16:00'), 'Cliente Dos');
select tests.check((select count(*) from public.bookings where status = 'confirmed') = 2, 'una hora cancelada queda libre para otro');
commit;

\warn '— 7. Profesional y bloqueos'

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000003');
select tests.check((select count(*) from public.bookings) = 3, 'la profesional ve la agenda de su negocio');
select tests.expect_error(
  $$select public.cancel_booking((select b.id from public.bookings b join public.staff s on s.id = b.staff_id where s.display_name = 'Beto' and b.status = 'confirmed'))$$,
  'PH006', 'la profesional no cancela citas de otro profesional');
with u as (update public.services set price_clp = 1 returning 1)
  select tests.check((select count(*) from u) = 0, 'la profesional no cambia precios');
rollback;

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000002');
insert into public.time_off (business_id, staff_id, starts_at, ends_at, reason)
  select st.business_id, st.id, tests.next_monday('17:00'), tests.next_monday('19:00'), 'Trámite'
  from public.staff st where st.display_name = 'Beto';
commit;

begin;
select tests.act_as('c0000000-0000-0000-0000-000000000001');
select tests.expect_error($$select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Beto'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('17:30'), 'Cliente Uno')$$, 'PH003', 'no se puede reservar en un bloqueo');
select tests.check((select count(*) from public.time_off) = 0, 'el cliente no ve el motivo de los bloqueos');
rollback;

\warn '— 8. Dueños'

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000001');
select tests.expect_error(
  $$delete from public.memberships where role = 'owner'$$, 'P0001', 'un negocio no se puede quedar sin dueño');
rollback;

begin;
select tests.act_as('a0000000-0000-0000-0000-000000000002');
with u as (update public.memberships set role = 'owner' where user_id = 'a0000000-0000-0000-0000-000000000002' returning 1)
  select tests.check((select count(*) from u) = 0, 'recepción no puede ascenderse a dueña');
select tests.expect_error(
  $$insert into public.memberships (business_id, user_id, role) select id, 'c0000000-0000-0000-0000-000000000001', 'admin' from public.businesses where slug = 'barberia-prueba-a'$$,
  '42501', 'recepción no puede agregar miembros');
rollback;

\warn '— 9. La base de datos impide duplicados aunque se salten las funciones'

begin;
-- Como administrador de la base (sin RLS): una inserción directa que se pisa igual falla.
select tests.expect_error($$
  insert into public.bookings (business_id, branch_id, staff_id, customer_id, starts_at, ends_at, blocked_until, source, total_clp)
  select b.business_id, b.branch_id, b.staff_id, b.customer_id, b.starts_at + interval '10 minutes', b.ends_at, b.blocked_until, 'manual', 0
  from public.bookings b where b.status = 'confirmed' limit 1$$, '23P01', 'restricción de no superposición en la tabla');
rollback;

\warn 'Todas las pruebas pasaron.'
