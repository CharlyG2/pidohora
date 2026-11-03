import { Platform, type ViewStyle } from 'react-native';

/**
 * Estilo "tecnológico y amable" (v3), igual que en Figma:
 * https://www.figma.com/design/XWT5q5oJigHvZIFuwbaF62
 * Los nombres entre paréntesis son las variables de color en Figma.
 */
export const colors = {
  primary: '#5B4CF5', // brand/violeta
  primaryDark: '#3F2FD9', // brand/violeta-oscuro
  primarySoft: '#EEEBFF', // brand/violeta-suave
  mint: '#12C29B', // brand/menta
  mintSoft: '#DDF8F0', // brand/menta-suave
  coral: '#FF6B5C', // brand/coral
  accent: '#F5A524', // estrellas de valoración
  bg: '#F6F6FB', // superficie/fondo
  card: '#FFFFFF', // superficie/tarjeta
  sunken: '#EFEFF6', // superficie/hundida
  text: '#15132E', // texto/principal
  muted: '#646280', // texto/secundario
  onPrimary: '#FFFFFF', // texto/invertido
  border: '#E4E3EF', // borde/suave
  danger: '#E5484D', // estado/error
  dangerSoft: '#FFE9E8', // estado/error-suave
  success: '#0E9F6E', // estado/exito
  successSoft: '#DCF7EC', // estado/exito-suave
  warning: '#C27803', // estado/pendiente
  warningSoft: '#FFF3D6', // estado/pendiente-suave
};

/** Colores para distinguir a cada profesional en la agenda (equipo/*). */
export const teamColors = ['#3B82F6', '#EC4899', '#F97316', '#12C29B', '#5B4CF5', '#C27803'];

export const radius = { sm: 12, md: 16, lg: 22 };

export const fontFamily = 'Plus Jakarta Sans';

/** Sombras suaves (Sombra/Tarjeta y Sombra/Flotante en Figma). */
export const shadow: Record<'card' | 'float', ViewStyle> = {
  card: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(21,19,46,0.06), 0 4px 14px rgba(21,19,46,0.06)' } as ViewStyle,
    default: { shadowColor: '#15132E', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  })!,
  float: Platform.select({
    web: { boxShadow: '0 10px 30px rgba(21,19,46,0.14)' } as ViewStyle,
    default: { shadowColor: '#15132E', shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  })!,
};

/** Degradados de las fotos de relleno, mientras no haya fotos reales. */
export const photoGradients: [string, string][] = [
  ['#6B5CF5', '#21D4AB'],
  ['#FA736B', '#FCBF59'],
  ['#3399F2', '#8C66F2'],
  ['#26BF99', '#A6E680'],
  ['#E666B3', '#8C59F2'],
];

/** Colores suaves lisos para las tarjetas pequeñas (sin degradado). */
export const softTints = ['#EEEBFF', '#DDF8F0', '#FFF3D6', '#FFE9E8', '#E6F0FE'];

/** Ancho máximo del contenido, para que en escritorio no se estire. */
export const MAX_WIDTH = 760;
