import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/dicebear': {
        target: 'https://api.dicebear.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dicebear/, ''),
      }
    }
  }
})
