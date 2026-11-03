# PidoHora

App para pedir hora en negocios de servicios: barberías, estética, psicología, peluquería de mascotas y cualquier negocio que trabaje con citas. Funciona en Android, iPhone y web (escritorio), con un solo código hecho en React Native + Expo.

## Estado actual (versión 2 del prototipo)

- **Entrada:** crear cuenta (cliente o negocio), iniciar sesión o seguir como invitado.
  Cuentas de prueba: `negocio@pidohora.cl` / `1234` y `cliente@pidohora.cl` / `1234`.
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

## Cómo correrla

```bash
npm install
npm run web      # en el navegador
npm start        # y escanear el QR con Expo Go en el celular
```

Revisión de tipos: `npx tsc --noEmit`.
