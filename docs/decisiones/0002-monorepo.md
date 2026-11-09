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

## Aplicación (2026-11-09)

- Espacios de trabajo de npm; un solo `npm install` en la raíz.
- `apps/web` sigue en Vite hasta la migración a Next.js (ADR 0003). Ya no necesita el reemplazo de `react-native`: importa `@pidohora/core` y `@pidohora/tokens`.
- Los paquetes se consumen como código TypeScript directo (sin compilar), mediante `exports` en su `package.json`.
- Al unificar la paleta se tomaron los valores más oscuros que ya usaba la web, porque cumplen contraste AA: texto secundario `#5C5A78`, error `#D93A3F`, pendiente `#A86500`; y se agregó `mintDark` `#0B7A61` para texto en menta. Una prueba automática revisa el contraste de los colores de texto.
- Pendiente de decisión de diseño: `success` `#0E9F6E` y el error tienen contraste bajo como texto pequeño sobre el fondo (3,1:1 y 4,2:1).
