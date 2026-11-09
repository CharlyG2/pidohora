# PidoHora

App para pedir hora en negocios de servicios: barberías, estética, psicología, peluquería de mascotas y cualquier negocio que trabaje con citas. Funciona en Android, iPhone y web (escritorio), con un solo código hecho en React Native + Expo.

## Estado actual (versión 2 del prototipo)

- **Entrada:** crear cuenta (cliente o negocio), iniciar sesión o seguir como invitado.
  Cuentas de prueba: `negocio@pidohora.cl` y `cliente@pidohora.cl` (en el prototipo la contraseña no se guarda ni se revisa; no uses una real).
- **Cliente (con o sin cuenta):** inicio con categorías, más visitados, mejor evaluados y nuevos;
  buscador por servicio; ficha del negocio con servicios, equipo, horario y reseñas; reserva con
  varios servicios, profesional o "cualquiera", día y hora libres; "Mis horas" con próximas y anteriores.
- **Negocio:** agenda tipo Google Calendar / Outlook con vista día (columnas por profesional), semana y
  mes; tocar un espacio libre crea una reserva a mano; detalle de cada cita (pagado, recordatorio,
  cancelar); clientes con visitas y gasto; servicios y equipo editables; horario de atención; plan y extras.
- Los datos son de ejemplo. En web se guardan en el navegador; pagos, WhatsApp y contraseñas están simulados.

## Próximos pasos

1. Base de datos y cuentas de usuario (Supabase).
2. Panel para que el negocio configure sus servicios, precios, profesionales y horarios.
3. Confirmaciones y recordatorios por WhatsApp.
4. Pagos reales con Mercado Pago o Webpay (pagos divididos).

## Documentación y plan

La auditoría, la arquitectura acordada (Supabase, monorepo, Next.js, Expo Router) y el registro de decisiones están en [`docs/`](docs/README.md).

## Cómo correrla

```bash
npm install
npm run web      # en el navegador
npm start        # y escanear el QR con Expo Go en el celular
```

Revisión de tipos: `npm run typecheck`. Pruebas: `npm test`. Las dos corren solas en cada PR (GitHub Actions), junto con una revisión de librerías vulnerables y de llaves secretas. Para reportar una falla de seguridad, ver [`SECURITY.md`](SECURITY.md).

## Estilo visual (v3)

La app usa el estilo "tecnológico y amable" del Figma (https://www.figma.com/design/XWT5q5oJigHvZIFuwbaF62): violeta `#5B4CF5` y menta `#12C29B`, sombras suaves, esquinas redondeadas e íconos de línea (`src/icons.tsx`). Los colores viven en `src/theme.ts` con el nombre de su variable en Figma. Mientras no haya fotos reales, las tarjetas muestran un degradado de color. La tipografía Plus Jakarta Sans se incluye en el demo web; en el teléfono aún usa la letra del sistema.

## Lugares cerca de ti

El cliente ve primero los lugares cerca de donde está (`src/location.ts`). Puede usar su ubicación actual (expo-location: GPS en el teléfono, ubicación del navegador en web), la comuna donde vive (se elige al crear la cuenta o en el perfil) o elegir cualquier comuna. El inicio muestra "más visitados cerca de ti" (hasta 8 km) y "lo más cerca"; la búsqueda se ordena por distancia y cada tarjeta muestra "a 1,2 km". Por ahora los negocios usan las coordenadas de su comuna; la versión real guardará su dirección exacta.

## Página web (computador y celular) — carpeta `web/`

La página web es un producto aparte de la app: es donde cualquier persona entra desde el navegador,
ve las tiendas (inicio con categorías, recomendados cerca de ti, ofertas, mejor evaluados),
busca con filtros, mira la ficha de cada negocio y reserva. También tiene "Mis horas" y la página
"Para negocios" con los planes. Usa los mismos datos de ejemplo y la misma lógica de horas libres
y ubicación que la app (`src/data.ts`, `src/utils.ts`, `src/location.ts`).

- Probar en tu computador: `npm install && cd web && npm install && npm run dev` (la web usa código de la raíz, por eso se instala primero lo de la raíz)
- Publicar: se construye con `BASE_PATH=/pidohora/ npm run build` y se sube a la rama `gh-pages`
  (GitHub Pages). La web queda en `https://charlyg2.github.io/pidohora/` y la app (versión web de
  la app del celular) en `https://charlyg2.github.io/pidohora/app/`.
- También se puede conectar el repositorio a Vercel: carpeta raíz `web`, comando `npm run build`,
  carpeta de salida `dist`.
