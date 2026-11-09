# 0004. Expo Router para la navegación de la app

- Estado: Aceptada (aprobada por Charles el 2026-11-09)
- Fecha: 2026-11-09

## Contexto

La app navega con una pila de pantallas hecha a mano en `src/store.tsx`. No hay direcciones, el botón "atrás" del navegador no funciona en la versión web y no se puede abrir la app directo en la ficha de un negocio.

## Decisión

Migrar la navegación a Expo Router (rutas por archivos), conservando las pantallas existentes.

## Por qué

- Enlaces profundos (`pidohora://negocio/barberia-el-corte`) y direcciones en web sin trabajo extra.
- Pestañas y pilas nativas, gestos de volver correctos en iPhone y Android.
- Es la navegación recomendada por Expo para el SDK actual.

## Alternativas descartadas

- **Mantener la pila casera:** cada mejora de navegación habría que hacerla a mano.
- **React Navigation directo:** Expo Router lo usa por debajo y agrega las rutas por archivo.

## Consecuencias

- El estado de navegación sale de `store.tsx`; el store queda solo para datos y sesión.
- Antes de migrar, revisar la documentación de la versión de Expo instalada (ver `AGENTS.md`).
