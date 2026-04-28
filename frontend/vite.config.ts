import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Necessário para Docker
    watch: {
      usePolling: true, // Ajuda com Hot Reload no Windows + Docker
    },
    proxy: {
      '/api': {
        target: 'http://server:8080', // Usa o nome do serviço do Docker
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
