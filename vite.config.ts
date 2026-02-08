import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // On Vercel, we want the root '/'
  // Only override if specifically requested via VITE_BASE_PATH
  base: process.env.VITE_BASE_PATH || '/',
})
