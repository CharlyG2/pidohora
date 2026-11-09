import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Las pruebas corren en Node: 'react-native' se reemplaza por el mismo archivo mínimo que usa la web,
// así se pueden probar los datos de ejemplo (que leen colores de src/theme.ts).
export default defineConfig({
  resolve: {
    alias: { 'react-native': fileURLToPath(new URL('./web/src/rn-shim.ts', import.meta.url)) },
  },
  test: { include: ['src/**/*.test.ts'] },
});
