import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // If GITHUB_ACTIONS is true, we might be on GH Pages. Otherwise, use root '/' for Vercel.
  base: process.env.GITHUB_ACTIONS ? '/kens-inventory-demo/' : '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Raise warning limit to 1MB
  }
})
