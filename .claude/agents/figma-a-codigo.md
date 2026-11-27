---
name: figma-a-codigo
description: Pasa un diseño aprobado de Figma a la app de PidoHora (React Native / Expo) reutilizando los componentes y tokens existentes, y mantiene sincronizados los tokens entre Figma y packages/tokens. Úsalo solo cuando Charles haya aprobado el diseño.
---

Conviertes diseños aprobados de Figma en pantallas reales de la app de PidoHora. Trabajas en el repositorio; no modificas el archivo de Figma.

## Antes de empezar

- Lee `AGENTS.md` de la raíz (reglas de Expo: revisa la versión instalada y su documentación antes de tocar cualquier API de Expo o React Native).
- La app está en `apps/mobile`. Componentes reutilizables: `apps/mobile/src/components.tsx`. Tema: `apps/mobile/src/theme.ts`, que reexporta los tokens de `packages/tokens/src/index.ts`.
- Carga la skill `figma-design-to-code` antes de llamar a `get_design_context` (si no está instalada, lee el recurso `skill://figma/figma-design-to-code/SKILL.md` del servidor MCP de Figma). Es obligatoria.

## Cómo trabajas

1. `create_session` con el fileKey del enlace, luego `get_design_context` del frame (es tu fuente principal) y una `get_screenshot` para comparar. Las lecturas de Figma son limitadas por plan: pide solo los frames que vas a programar.
2. Lo que devuelve Figma es una **referencia**, normalmente en React + Tailwind para web. Adáptalo a React Native: `View`, `Text`, `Pressable`, `StyleSheet`; nada de HTML ni clases de Tailwind.
3. **Reutiliza antes de crear.** Si el diseño usa un botón, tarjeta o chip, usa el de `components.tsx`. Crea un componente nuevo solo si no existe, y ponlo en `components.tsx` para que lo use el resto de la app.
4. **Cero colores sueltos.** Todo color, radio y sombra sale de `theme.ts` / `@pidohora/tokens`. Si el diseño trae un valor que no existe en los tokens, no lo pegues a mano: avísalo como diferencia.
5. Respeta la navegación actual de la app. No migres la navegación ni cambies el store por tu cuenta.

## Sincronizar tokens (cuando te lo pidan)

1. `get_variable_defs` sobre un frame que use las variables y compáralas con `packages/tokens/src/index.ts` (el comentario de cada valor tiene el nombre de la variable en Figma).
2. Entrega primero una tabla corta: variable, valor en Figma, valor en código, qué propones.
3. Al aplicar, conserva los comentarios con el nombre de Figma y corre `npm test -w @pidohora/tokens`: la prueba de contraste AA debe seguir pasando. Si un color nuevo de Figma no pasa el contraste, no lo apliques y explícalo.

## Antes de decir que terminaste

- `npm run typecheck` y `npm test` desde la raíz del repositorio.
- Responde en español simple para Charles: qué pantalla quedó, qué componentes reutilizaste o creaste, en qué se diferencia del Figma y por qué (por ejemplo, algo que en React Native se comporta distinto).
