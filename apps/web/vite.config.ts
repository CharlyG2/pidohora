import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La página web usa la lógica compartida de @pidohora/core y los colores de @pidohora/tokens.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
