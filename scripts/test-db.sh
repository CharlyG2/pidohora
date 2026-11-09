#!/usr/bin/env bash
# Prueba las migraciones de Supabase en un PostgreSQL normal (local o en GitHub Actions).
# Crea una base de datos temporal, aplica las migraciones en orden y corre las pruebas.
# Uso: PGHOST=localhost PGUSER=postgres PGPASSWORD=... scripts/test-db.sh
set -euo pipefail
shopt -s inherit_errexit 2>/dev/null || true
cd "$(dirname "$0")/.."

DB="pidohora_pruebas_$$"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 --dbname "$DB")

dropdb --if-exists "$DB" >/dev/null 2>&1 || true
createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1 || true' EXIT

echo "== Imitando lo que trae Supabase"
"${PSQL[@]}" -f supabase/tests/00_supabase_local.sql

echo "== Aplicando migraciones"
for f in supabase/migrations/*.sql; do
  echo "   $f"
  "${PSQL[@]}" -f "$f"
done

echo "== Pruebas"
"${PSQL[@]}" -f supabase/tests/01_datos_de_prueba.sql >/dev/null
"${PSQL[@]}" -f supabase/tests/10_pruebas.sql 2>&1 >/dev/null | sed -E 's/^psql:[^ ]+ NOTICE:  //'

echo "== Dos reservas a la misma hora, al mismo tiempo"
# Dos sesiones intentan tomar la misma hora: la primera espera 2 segundos antes de confirmar.
# La segunda queda esperando a la primera y luego debe fallar con "hora ocupada" (PH004).
SQL_RESERVA="select public.create_booking(
  (select id from public.businesses where slug = 'barberia-prueba-a'),
  (select id from public.staff where display_name = 'Beto'),
  array[(select id from public.services where name = 'Corte')],
  tests.next_monday('12:00'), 'Simultáneo')"
"${PSQL[@]}" -c "begin; select tests.act_as('c0000000-0000-0000-0000-000000000001'); $SQL_RESERVA; select pg_sleep(2); commit;" >/dev/null &
PRIMERA=$!
sleep 0.5
set +e
SEGUNDA=$("${PSQL[@]}" -c "begin; select tests.act_as('c0000000-0000-0000-0000-000000000002'); $SQL_RESERVA; commit;" 2>&1)
CODIGO=$?
set -e
wait $PRIMERA
if [ $CODIGO -eq 0 ] || ! grep -q "ya no está disponible" <<<"$SEGUNDA"; then
  echo "FALLA: la segunda reserva simultánea no fue rechazada"; echo "$SEGUNDA"; exit 1
fi
TOTAL=$("${PSQL[@]}" -tA -c "select count(*) from public.bookings b join public.customers c on c.id = b.customer_id where c.full_name in ('Cliente Uno','Cliente Dos') and b.starts_at = tests.next_monday('12:00')")
[ "$TOTAL" = "1" ] || { echo "FALLA: quedaron $TOTAL reservas a la misma hora"; exit 1; }
echo "ok  solo una de las dos reservas simultáneas quedó guardada"

echo "Base de datos: todas las pruebas pasaron."
