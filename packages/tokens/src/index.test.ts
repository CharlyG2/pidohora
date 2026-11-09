import { describe, expect, it } from 'vitest';

import { colors, cssVariables, cssVariablesText } from './index';

// Contraste según WCAG 2.1.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('tokens', () => {
  it('genera las variables CSS que usa la web', () => {
    const vars = cssVariables();
    expect(vars['--violeta']).toBe(colors.primary);
    expect(vars['--texto-2']).toBe(colors.muted);
    expect(vars['--r-md']).toBe('16px');
    expect(cssVariablesText()).toContain('--violeta: #5B4CF5;');
  });

  it('el texto principal, el secundario y el violeta se leen bien sobre el fondo y las tarjetas (AA, 4,5:1)', () => {
    for (const fg of [colors.text, colors.muted, colors.primary, colors.mintDark]) {
      expect(contrast(fg, colors.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(fg, colors.card)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('el texto blanco se lee bien sobre el botón violeta', () => {
    expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5);
  });
});
