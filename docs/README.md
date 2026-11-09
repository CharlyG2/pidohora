# Documentación de PidoHora

- [Auditoría y plan SaaS (noviembre 2026)](auditoria-2026-11.md): estado del prototipo, arquitectura propuesta, base de datos, roadmap, riesgos y costos.
- [Auditoría técnica y de seguridad v2 (noviembre 2026)](auditoria-seguridad-2026-11.md): hallazgos de seguridad, calidad y DevOps, con su estado.
- [Base de datos (Supabase)](base-de-datos.md): tablas, seguridad por negocio, reglas de reserva y cómo se prueban.
- [Decisiones de arquitectura (ADR)](decisiones/): cada decisión técnica importante, por qué se tomó y qué se descartó.

## Cómo se trabaja

1. Analizar, documentar y proponer antes de programar.
2. Cada decisión técnica importante queda como ADR en `decisiones/`.
3. Trabajo en tareas pequeñas, cada una en su PR, con la revisión automática (tipos y pruebas) en verde.
4. Nada simulado se presenta como real, y no hay datos de ejemplo en producción.
5. Cambiar una tecnología importante requiere aprobación de producto (Charles).

## Revisiones locales

```bash
npm install         # una vez, en la raíz
npm run typecheck   # tipos de app, web, core y tokens
npm test            # pruebas (horas libres, formatos, ubicación, contraste de colores, limpieza de datos guardados)
npm run build:web   # compilación de la web
npm run test:db     # base de datos (requiere PostgreSQL local; Supabase usa la versión 17)
```
