/// <reference types="vitest/config" />

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      setupFiles: './src/tests/setup.ts',
    },
  };
});
