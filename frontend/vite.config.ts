import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Em desenvolvimento, /api/* vai para a API .NET (perfil http do launchSettings),
    // sem precisar de CORS: o navegador vê tudo como a mesma origem.
    proxy: {
      '/api': {
        target: 'http://localhost:5193',
        changeOrigin: true,
        rewrite: (url) => url.replace(/^\/api/, ''),
      },
    },
  },
})
