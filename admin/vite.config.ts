import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 2203,
    strictPort: true,
    watch: { usePolling: true },
  },
  preview: {
    host: '0.0.0.0',
    port: 2203,
    strictPort: true,
  },
});
