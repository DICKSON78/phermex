import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dashboard/',
  build: {
    sourcemap: false,
    // Builds straight into Laravel's public directory, because that is the only
    // place a request for /dashboard/... is ever served from. Writing to dist/
    // here produced bundles that nothing read, so every fix kept looking
    // unapplied no matter how many times it was pushed.
    outDir: '../public/dashboard',
    // The output now sits outside the project root, so Vite needs to be told
    // explicitly that emptying this directory is intended. It only ever held
    // generated assets.
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
})
