# 0002. Un solo repositorio con lógica y tokens compartidos

- Estado: Aceptada
- Fecha: 2026-11-09

## Contexto

Hoy la web (`web/`) reutiliza la lógica de la app importando `../src` mediante un alias, y define sus colores por separado. Los valores de color ya difieren entre ambas.

## Decisión

Organizar el repositorio como monorepo con espacios de trabajo de npm:

- `apps/mobile`: app Expo (cliente; luego negocio).
- `apps/web`: web Next.js (sitio público y panel del negocio).
- `packages/core`: tipos, reglas de negocio, horas libres, formatos y validaciones, sin dependencias de interfaz.
- `packages/tokens`: colores, tipografía, espaciados, radios y sombras; genera las variables CSS de la web y el tema de la app.

## Por qué

Compartir lógica y tokens, no componentes visuales: cada plataforma construye sus propias piezas, pero todas calculan igual y se ven coherentes.

## Alternativas descartadas

- **Repositorios separados:** obliga a publicar paquetes para compartir código.
- **Componentes visuales compartidos (react-native-web en todo):** limita el panel de escritorio.

## Consecuencias

- El cambio de carpetas se hace en un PR propio, moviendo archivos sin cambiar su contenido, con la revisión automática en verde.
