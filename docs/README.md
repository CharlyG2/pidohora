# Documentación de PidoHora

- [Auditoría y plan SaaS (noviembre 2026)](auditoria-2026-11.md): estado del prototipo, arquitectura propuesta, base de datos, roadmap, riesgos y costos.
- [Decisiones de arquitectura (ADR)](decisiones/): cada decisión técnica importante, por qué se tomó y qué se descartó.

## Cómo se trabaja

1. Analizar, documentar y proponer antes de programar.
2. Cada decisión técnica importante queda como ADR en `decisiones/`.
3. Trabajo en tareas pequeñas, cada una en su PR, con la revisión automática (tipos y pruebas) en verde.
4. Nada simulado se presenta como real, y no hay datos de ejemplo en producción.
5. Cambiar una tecnología importante requiere aprobación de producto (Charles).

## Revisiones locales

```bash
npm run typecheck   # tipos de la app
npm test            # pruebas de la lógica (horas libres, formatos, ubicación)
cd web && npm run build   # tipos y compilación de la web (requiere npm install en la raíz y en web/)
```
