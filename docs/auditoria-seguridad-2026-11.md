# Auditoría técnica y de seguridad (v2) — 9 de noviembre de 2026

Documento completo: https://claude.ai/artifact/6iMMFRyrGY7y5HFJ7x99nL

Resultado: 0 críticos, 1 alto, 5 medios, 3 bajos. No hay backend ni datos reales, así que ninguno
compromete datos hoy; varios serían críticos si el código se conectara a una base tal como está.

| # | Hallazgo | Riesgo hoy | Al lanzar | Estado |
| --- | --- | --- | --- | --- |
| S1 | Negocio real (Barbería Innovva Studio) en la demo pública sin permiso | Alto | Alto | Corregido: retirado de la demo, se limpia también de los navegadores que lo tenían guardado, y la confirmación avisa que es una prueba |
| S2 | Contraseñas guardadas tal cual en el navegador | Medio | Crítico | Corregido en la demo: ya no se guardan ni se revisan, y se borran las que quedaron guardadas. En el producto: Supabase Auth |
| S3 | Permisos aplicados solo en la pantalla | Medio | Crítico | Pendiente: RLS y pruebas de aislamiento (Fase 0) |
| S4 | Reserva y precio decididos en el dispositivo | Medio | Crítico | Pendiente: función de reserva en la base + restricción de exclusión |
| S5 | `vitest` 3.2 con fallas críticas conocidas | Medio | Medio | Corregido: `vitest` 5.1; quedan 8 avisos medios de Expo (se resuelven al actualizar el SDK; no usar `npm audit fix --force`) |
| S6 | Revisión automática con permisos de más | Medio | Medio | Corregido: permisos de solo lectura, acciones fijadas por SHA, Dependabot, revisión de llaves secretas y `npm audit` |
| S7 | IDs con `Math.random` | Bajo | Alto | Pendiente: UUID generados por la base |
| S8 | Sin política de privacidad ni términos | Bajo | Alto | Pendiente: revisión legal antes del piloto (Ley 21.719) |
| S9 | Sitio sin cabeceras de seguridad (CSP) | Bajo | Medio | Pendiente: al migrar a Next.js |

## Barbería Innovva Studio

Se retiró de `packages/core/src/data.ts` hasta tener el permiso escrito de su dueño. Sus datos siguen en el historial
de Git (commit `b497b28`) para restaurarlos si acepta. Mientras tanto, `packages/core/src/persist.ts` la quita de los
datos que algún navegador tenga guardados.

## Pendiente que solo puede hacer el dueño del repositorio en GitHub

- Proteger `main`: exigir la revisión automática en verde antes de unir y bloquear borrado y reescritura.
- Activar el escaneo de secretos y la protección de push (Settings › Code security).
- Activar el reporte privado de vulnerabilidades (Settings › Code security › Private vulnerability reporting): es el canal que indica `SECURITY.md`.
- Cuando exista un correo real del dominio (por ejemplo seguridad@pidohora.cl), agregarlo a `SECURITY.md`. El sitio aún muestra hola@pidohora.cl, que no existe.
