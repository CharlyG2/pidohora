/**
 * Tokens de diseño de PidoHora: estilo "tecnológico y amable" del Figma
 * (https://www.figma.com/design/XWT5q5oJigHvZIFuwbaF62).
 *
 * Es la única fuente de colores, radios, sombras y tipografía. La app (React Native)
 * los lee como objetos y la web los recibe como variables CSS (`cssVariables`).
 * Para cambiar un color en todo PidoHora, se cambia aquí.
 *
 * Entre paréntesis, el nombre de la variable en Figma.
 */

export const colors = {
  primary: '#5B4CF5', // brand/violeta
  primaryDark: '#3F2FD9', // brand/violeta-oscuro
  primarySoft: '#EEEBFF', // brand/violeta-suave
  mint: '#12C29B', // brand/menta (solo fondos y bordes: como texto no tiene contraste suficiente)
  mintDark: '#0B7A61', // brand/menta-oscuro (texto sobre fondo claro)
  mintSoft: '#DDF8F0', // brand/menta-suave
  coral: '#FF6B5C', // brand/coral
  accent: '#F5A524', // estrellas de valoración
  bg: '#F6F6FB', // superficie/fondo
  card: '#FFFFFF', // superficie/tarjeta
  sunken: '#EFEFF6', // superficie/hundida
  text: '#15132E', // texto/principal
  muted: '#5C5A78', // texto/secundario
  onPrimary: '#FFFFFF', // texto/invertido
  border: '#E4E3EF', // borde/suave
  danger: '#D93A3F', // estado/error
  dangerSoft: '#FFE9E8', // estado/error-suave
  success: '#0E9F6E', // estado/exito
  successSoft: '#DCF7EC', // estado/exito-suave
  warning: '#A86500', // estado/pendiente
  warningSoft: '#FFF3D6', // estado/pendiente-suave
} as const;

/** Colores para distinguir a cada profesional en la agenda (equipo/*). */
export const teamColors = ['#3B82F6', '#EC4899', '#F97316', '#12C29B', '#5B4CF5', '#C27803'] as const;

/** Radios de las esquinas, en px. */
export const radius = { sm: 12, md: 16, lg: 22 } as const;

/** Escala de espaciados, en px (múltiplos de 4). */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 } as const;

export const fontFamily = 'Plus Jakarta Sans';

/** Escala de tamaños de texto, en px. */
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 } as const;

/**
 * Sombras suaves (Sombra/Tarjeta y Sombra/Flotante en Figma).
 * `css` es para la web; `native` para iOS y Android.
 */
export const shadows = {
  card: {
    css: '0 1px 2px rgba(21,19,46,0.06), 0 4px 14px rgba(21,19,46,0.06)',
    native: { shadowColor: '#15132E', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  },
  float: {
    css: '0 10px 30px rgba(21,19,46,0.14)',
    native: { shadowColor: '#15132E', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  },
} as const;

/** Degradados de las fotos de relleno, mientras no haya fotos reales. */
export const photoGradients: readonly (readonly [string, string])[] = [
  ['#6B5CF5', '#21D4AB'],
  ['#FA736B', '#FCBF59'],
  ['#3399F2', '#8C66F2'],
  ['#26BF99', '#A6E680'],
  ['#E666B3', '#8C59F2'],
];

/** Colores suaves lisos para las tarjetas pequeñas (sin degradado). */
export const softTints = ['#EEEBFF', '#DDF8F0', '#FFF3D6', '#FFE9E8', '#E6F0FE'] as const;

/** Variables CSS que usa la web (`var(--violeta)`, etc.), generadas desde los tokens. */
export function cssVariables(): Record<string, string> {
  return {
    '--violeta': colors.primary,
    '--violeta-osc': colors.primaryDark,
    '--violeta-suave': colors.primarySoft,
    '--menta': colors.mint,
    '--menta-osc': colors.mintDark,
    '--menta-suave': colors.mintSoft,
    '--coral': colors.coral,
    '--ambar': colors.accent,
    '--fondo': colors.bg,
    '--tarjeta': colors.card,
    '--hundido': colors.sunken,
    '--texto': colors.text,
    '--texto-2': colors.muted,
    '--borde': colors.border,
    '--error': colors.danger,
    '--error-suave': colors.dangerSoft,
    '--exito': colors.success,
    '--exito-suave': colors.successSoft,
    '--pend': colors.warning,
    '--pend-suave': colors.warningSoft,
    '--sombra': shadows.card.css,
    '--sombra-flot': shadows.float.css,
    '--r-sm': `${radius.sm}px`,
    '--r-md': `${radius.md}px`,
    '--r-lg': `${radius.lg}px`,
  };
}

/** Las variables CSS como texto, listas para un bloque `:root { … }`. */
export function cssVariablesText(): string {
  return Object.entries(cssVariables())
    .map(([k, v]) => `${k}: ${v};`)
    .join(' ');
}
