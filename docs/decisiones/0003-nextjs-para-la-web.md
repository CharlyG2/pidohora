# 0003. Next.js para la web pública y el panel del negocio

- Estado: Aceptada (aprobada por Charles el 2026-11-09)
- Fecha: 2026-11-09

## Contexto

La web actual es una aplicación Vite que se dibuja entera en el navegador. El negocio necesita un panel de escritorio denso (agenda, tablas, reportes), y cada negocio necesita una página pública (`pidohora.cl/negocio`) que Google pueda indexar.

## Decisión

Construir la web en Next.js (React), con dos áreas en la misma aplicación: sitio público (inicio, búsqueda, ficha, reserva) y panel del negocio (`/panel`). Se despliega en Vercel.

## Por qué

- Las páginas públicas se generan en el servidor y aparecen bien en buscadores y al compartir el link en WhatsApp o Instagram.
- Sigue siendo React: las páginas y estilos actuales de `web/` se trasladan, no se rehacen.
- Integración directa con Supabase Auth en el servidor.

## Alternativas descartadas

- **Seguir con Vite:** funciona, pero sin indexación ni vista previa de links.
- **Expo web para el panel:** limitado para tablas y agenda en pantalla ancha.

## Consecuencias

- Vercel Hobby no permite uso comercial: producción requiere Vercel Pro (US$20/mes) u otro hosting.
- Mientras se migra, GitHub Pages sigue sirviendo la web Vite actual como demo.
