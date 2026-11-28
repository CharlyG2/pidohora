# Equipo de agentes de PidoHora

Un **agente** es un Claude con un solo trabajo, sus propias instrucciones y solo las herramientas que necesita. Es como tener especialistas en el equipo en vez de una sola persona haciéndolo todo: cada uno trabaja con su propio contexto, así no se distrae con lo que hacen los otros.

**Multiagente** es cuando un "director" reparte el trabajo entre varios especialistas y junta los resultados. En PidoHora el director es la skill `/disenar`.

¿Quieres aprender a hacer uno tú? Lee [cómo crear un agente](como-crear-un-agente.md).

## El equipo actual

| Agente | Qué hace | Puede modificar |
| --- | --- | --- |
| `disenador-figma` | Diseña pantallas y flujos en Figma con el design system de PidoHora | Solo agrega frames en la página `🤖 Propuestas` del Figma |
| `figma-a-codigo` | Pasa un diseño aprobado a la app (React Native) y sincroniza tokens | El código del repositorio |

Los archivos están en `.claude/agents/`. Cada uno es un texto con instrucciones: se edita como cualquier documento.

## El flujo `/disenar`

```
Charles: /disenar pantalla para que el barbero vea su día
   │
   ├─► disenador-figma  → crea la pantalla en Figma
   │
   ├─► Charles revisa: aprueba, pide ajustes o descarta
   │        (si pide ajustes, vuelve a disenador-figma)
   │
   └─► figma-a-codigo   → la programa en la app (solo con aprobación)
```

La regla de oro: **los agentes proponen, Charles decide.** Nada pasa al sistema de diseño oficial ni al código sin su aprobación.

## Cómo usarlo

1. Abre Claude Code en la carpeta del repositorio.
2. La primera vez, escribe `/mcp`, elige `figma` y conecta tu cuenta de Figma (la configuración está en `.mcp.json`).
3. Escribe `/disenar` y lo que necesitas, por ejemplo: `/disenar pantalla de confirmación de reserva para el cliente`.
4. También puedes llamar a un agente directo: "usa el agente figma-a-codigo para programar este frame: <enlace>".

## Límites de Figma a tener en cuenta

Figma limita cuántas veces un agente puede **leer** archivos por MCP según el plan y el asiento:

- Plan Starter, o asiento View/Collab: hasta 20 lecturas al mes.
- Plan Professional u Organization con asiento Full o Dev: hasta 200 al día.

Las herramientas que **escriben** en Figma no cuentan para ese límite. Fuente: [Figma, Rate limits & access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/) (Figma puede cambiarlos). Por eso los agentes están instruidos para leer lo mínimo.

## Próximos agentes posibles (cuando hagan falta, no antes)

- `critico-ux`: revisa un diseño y devuelve una crítica priorizada, sin modificar nada.
- `revisor-seguridad`: revisa cambios en `supabase/` (permisos por negocio) antes de unir un PR.
- `qa`: recorre los flujos clave (reservar, cancelar, ver agenda) y corre las pruebas.
