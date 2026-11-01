import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (!env.VITE_ORIGIN) throw new Error('Missing required environment variable: VITE_ORIGIN')

  return {
    plugins: [react()],
    build: {
      minify: 'esbuild', // Use esbuild for faster minification
      chunkSizeWarningLimit: 512,
    },
  }
})
