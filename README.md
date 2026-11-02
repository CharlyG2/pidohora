# PidoHora

App para pedir hora en negocios de servicios: barberías, estética, psicología, peluquería de mascotas y cualquier negocio que trabaje con citas. Funciona en Android, iPhone y web (escritorio), con un solo código hecho en React Native + Expo.

## Estado actual (primera versión)

- **Cliente:** elige negocio, uno o varios servicios, profesional (o "cualquiera disponible"), día y hora, deja su nombre y WhatsApp, y elige pagar en línea o en el local.
- **Negocio:** agenda por día y por profesional, con cuánto se ha cobrado, cuánto falta por cobrar, y botones para marcar pagado o cancelar.
- Los datos son de ejemplo y viven en la memoria de la app. El pago y los mensajes de WhatsApp están simulados.

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
