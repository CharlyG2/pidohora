# Base de datos (Supabase)

La base de datos vive en Supabase (PostgreSQL). Su estructura se guarda en este repositorio como
**migraciones**: archivos SQL en `supabase/migrations/`, que se aplican en orden y nunca se editan
una vez aplicados (para cambiar algo se agrega una migración nueva). Ver [ADR 0001](decisiones/0001-supabase-como-backend.md).

| Migración | Qué hace |
| --- | --- |
| `…190000_esquema_base.sql` | Tablas, relaciones, restricciones e índices |
| `…190100_seguridad_rls.sql` | Row Level Security: quién puede ver y cambiar qué |
| `…190200_reservas.sql` | Funciones del servidor: crear negocio, reservar, mover, cancelar, asistencia, horas ocupadas |

## Cómo llega a Supabase

El proyecto de Supabase está conectado a este repositorio (Project Settings → Integrations → GitHub,
directorio de trabajo `.`, "Deploy to production" con la rama `main`). Al unir un PR a `main`, Supabase
aplica solo las migraciones nuevas. `supabase/config.toml` sirve para correr Supabase localmente; como no
tiene bloque `[remotes]`, no cambia la configuración de Auth ni de la API del proyecto en la nube, y los
datos de `seed.sql` nunca se cargan en la nube.

Proyecto de desarrollo: **Pidohora-dev** (São Paulo). Producción será un proyecto aparte, en plan Pro.

## Reglas de seguridad

- Todas las tablas tienen RLS activado. Cada fila de un negocio lleva `business_id`.
- Roles por negocio en `memberships`: `owner` (dueño), `admin`, `reception` (recepción), `staff` (profesional).
  Una persona puede tener roles distintos en negocios distintos.
- **Público sin cuenta:** ve negocios publicados, su equipo, servicios y horarios, y las horas ocupadas
  (`busy_intervals`, solo intervalos, sin datos de clientes). No puede consultar clientes ni reservas.
- **Cliente con cuenta:** ve sus reservas y su ficha en cada negocio.
- **Profesional:** ve la agenda y los clientes de su negocio; marca asistencia de sus propias citas.
- **Recepción:** además crea, mueve y cancela cualquier reserva, y maneja bloqueos.
- **Admin y dueño:** además configuran equipo, servicios, horarios y precios, y ven pagos.
  Solo el dueño agrega o quita miembros, y un negocio nunca se queda sin dueño.
- Reservas, pagos, transacciones y notificaciones **no se escriben directo** en las tablas: solo con las
  funciones del servidor o desde Edge Functions con la llave de servidor.
- La llave `service_role` nunca va en la app ni en la web (la revisión automática lo verifica).

## Reglas de reservas

- Un profesional no puede tener dos reservas activas que se pisen: lo garantiza la restricción
  `bookings_no_overlap`, incluso si dos personas reservan en el mismo instante.
- El precio y la hora de término los calcula el servidor desde los servicios (con el precio o duración
  propios del profesional, si existen). La agenda queda bloqueada también el tiempo de limpieza (`buffer_minutes`).
- La hora debe caer dentro de un tramo del horario del profesional (en la zona horaria del negocio) y no
  cruzar un bloqueo (`time_off`).
- Plazos por negocio: anticipación mínima, días máximos hacia adelante y plazo para cancelar o mover.
  Recepción puede saltarse la anticipación mínima y el plazo de cancelación.
- Límite contra reservas falsas: máximo 3 horas futuras activas por persona en un mismo negocio.
- Las reservas no se borran: cancelar cambia el estado y todo queda en `booking_events`.

Errores con mensaje en español y código propio: `PH001` sin permiso, `PH002` dato inválido,
`PH003` fuera de horario o bloqueado, `PH004` hora ocupada, `PH005` fuera de plazo, `PH006` no encontrado.

## Pruebas

`scripts/test-db.sh` crea una base de datos temporal en un PostgreSQL normal, imita lo mínimo de
Supabase (`supabase/tests/00_supabase_local.sql`), aplica las migraciones y corre 58 verificaciones
(`supabase/tests/10_pruebas.sql`): aislamiento entre negocios, lo que ve el público, reglas de reserva,
mover, cancelar, roles, y dos reservas simultáneas a la misma hora. Corre sola en cada PR, con PostgreSQL 17 como Supabase.

```bash
# con PostgreSQL instalado localmente (Supabase usa la versión 17; la revisión automática prueba con 17)
PGUSER=postgres scripts/test-db.sh
```

## Pendiente

- Programar `private.expire_pending_bookings()` cada 5 minutos con pg_cron cuando existan pagos (Fase 2).
- Motor de horas libres para mostrar en la app y la web (Fase 1), sobre `busy_intervals` y los horarios.
- Sesiones anónimas de Supabase para reservar sin crear cuenta (requiere activarlas en Authentication).
