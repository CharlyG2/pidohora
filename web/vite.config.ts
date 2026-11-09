import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// La página web reutiliza los datos de ejemplo y la lógica de la app (carpeta ../src).
// 'react-native' se reemplaza por un pequeño archivo, porque la web no lo necesita.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: { 'react-native': fileURLToPath(new URL('./src/rn-shim.ts', import.meta.url)) },
  },
  server: { fs: { allow: ['..'] } },
});
