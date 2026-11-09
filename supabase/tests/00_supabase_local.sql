-- SOLO PARA PRUEBAS LOCALES Y EN GITHUB. No es una migración y no se aplica en Supabase.
-- Imita lo mínimo que Supabase ya trae: roles, esquema auth, auth.uid() y permisos por defecto,
-- para poder probar las migraciones en un PostgreSQL normal.

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

create schema if not exists extensions;
create schema if not exists auth;

create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  is_anonymous boolean not null default false
);

-- Igual que en Supabase: el usuario sale del token (JWT) de la petición.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(
    current_setting('request.jwt.claim.sub', true),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  ), '')::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public, extensions to anon, authenticated, service_role;

-- Permisos por defecto de Supabase: los roles de la API tienen acceso a las tablas y RLS decide.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
