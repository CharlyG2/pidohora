import { Platform, type ViewStyle } from 'react-native';
import { shadows } from '@pidohora/tokens';

/**
 * Tema de la app. Los valores vienen de @pidohora/tokens (la misma fuente que usa la web);
 * aquí solo se adaptan a React Native.
 */
export { colors, teamColors, radius, fontFamily, photoGradients, softTints } from '@pidohora/tokens';

/** Sombras suaves (Sombra/Tarjeta y Sombra/Flotante en Figma). */
export const shadow: Record<'card' | 'float', ViewStyle> = {
  card: Platform.select({
    web: { boxShadow: shadows.card.css } as ViewStyle,
    default: shadows.card.native as ViewStyle,
  })!,
  float: Platform.select({
    web: { boxShadow: shadows.float.css } as ViewStyle,
    default: shadows.float.native as ViewStyle,
  })!,
};

/** Ancho máximo del contenido, para que en escritorio no se estire. */
export const MAX_WIDTH = 760;
