# Auditoría y plan SaaS — noviembre 2026

Documento completo (con diagramas y tablas): https://claude.ai/artifact/NpF5KKcu9pUigNNpfzWwUy

Este archivo resume las conclusiones para que vivan junto al código.

## Estado actual

- Dos interfaces: app Expo (Android, iPhone y web) y una web aparte en Vite (`web/`). Comparten tipos, horas libres y ubicación desde `src/`.
- No hay backend. Los datos son de ejemplo y se guardan en el navegador (`localStorage`) o en memoria. La app y la web no comparten reservas entre sí.
- Simulado o solo visual: inicio de sesión (contraseñas en texto plano), pagos, WhatsApp, planes, reseñas y el link `pidohora.cl/negocio`.
- Ambos proyectos compilan sin errores de tipos. No había pruebas ni CI antes de este cambio.

## Deuda técnica principal

1. Sin backend ni sincronización entre dispositivos.
2. Nada impide reservas duplicadas fuera de la pantalla: se resolverá con una restricción de exclusión en PostgreSQL.
3. Cancelar borra la reserva; no hay historial ni "mover".
4. Horarios solo en horas enteras, un tramo por día, iguales para todo el equipo, sin bloqueos.
5. Zona horaria implícita (reloj del dispositivo).
6. Servicios, equipo y reseñas anidados dentro del negocio.
7. IDs con `Math.random`.
8. Navegación casera sin direcciones ni enlaces profundos.
9. Paleta duplicada entre `src/theme.ts` y `web/src/styles.css`, con valores que ya difieren.

## Arquitectura acordada

- Supabase como backend (PostgreSQL + RLS, Auth, Storage, Edge Functions) — [ADR 0001](decisiones/0001-supabase-como-backend.md).
- Monorepo con lógica y tokens compartidos — [ADR 0002](decisiones/0002-monorepo.md).
- Next.js para la web pública y el panel del negocio — [ADR 0003](decisiones/0003-nextjs-para-la-web.md).
- Expo Router en la app — [ADR 0004](decisiones/0004-expo-router.md).
- MVP sin pagos ni WhatsApp reales (propuesta) — [ADR 0005](decisiones/0005-alcance-del-mvp.md).

## Roadmap

| Fase | Contenido | Para avanzar |
| --- | --- | --- |
| 0 · Cimientos | Unir ramas, pruebas, CI, monorepo, tokens, Supabase con esquema y RLS probada | RLS con pruebas de aislamiento en verde |
| 1 · MVP | Cuentas reales, negocio, equipo, servicios, horarios, reserva validada en el servidor, agenda de escritorio, correos | Piloto estable con 3 a 5 negocios |
| 2 · Operación | WhatsApp, pagos y anticipos, historial, reportes, comisiones, caja, app de negocio | Negocios pagando |
| 3 · Crecimiento | Sucursales, fidelización, cupones, inventario, suscripciones, analítica | Según demanda |
