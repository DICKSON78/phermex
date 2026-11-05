import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // public/ holds Laravel/static files for the live server, not website build
  // input. Copying it into dist/ caused stale deployments to be re-imported on
  // every build, so keep the build output limited to the app entry + assets.
  publicDir: false,
})
