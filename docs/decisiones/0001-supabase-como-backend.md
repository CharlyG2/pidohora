# 0001. Supabase como backend

- Estado: Aceptada
- Fecha: 2026-11-09

## Contexto

El prototipo no tiene servidor: los datos viven en el navegador. Un SaaS de reservas necesita datos compartidos entre dispositivos, cuentas seguras, aislamiento entre negocios y validar en el servidor las operaciones críticas (crear, mover y cancelar reservas).

## Decisión

Usar Supabase como backend único:

- **PostgreSQL** con Row Level Security (RLS) en todas las tablas; cada fila de negocio lleva `business_id`.
- **Auth** para cuentas (correo y contraseña, Google; Apple si hay login social en iPhone).
- **Storage** para fotos y logos, con carpeta y políticas por negocio.
- **Funciones en la base (RPC)** para reservas, y **Edge Functions** para pagos, webhooks y mensajes.
- Proyectos separados para desarrollo y producción; esquema versionado con migraciones en el repositorio.

## Por qué

- PostgreSQL permite garantizar en la base que no haya reservas duplicadas (restricción de exclusión sobre `tstzrange`).
- RLS aplica los permisos a cada consulta, aunque alguien tenga la llave pública.
- Auth, archivos, funciones y tiempo real en un solo servicio, con plan gratis para desarrollar y Pro (US$25/mes) para producción.
- Es PostgreSQL estándar: los datos se pueden migrar si algún día se cambia de proveedor.

## Alternativas descartadas

- **Backend propio (Node + base administrada):** más control, pero mucho más código y mantención para un equipo de una persona.
- **Firebase:** base de datos documental; las reglas de no superposición y los reportes son más difíciles que en SQL.

## Consecuencias

- La llave `service_role` vive solo en Edge Functions y secretos del servidor; nunca en la app ni en la web.
- Cada política RLS necesita pruebas automáticas de aislamiento entre negocios.
- El plan gratis pausa proyectos inactivos: producción debe estar en Pro desde el primer negocio real.
