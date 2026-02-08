import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you are deploying to GitHub Pages, set this to '/kens-inventory-demo/'
  // For Vercel/Netlify/Standard domains, '/' is required.
  base: process.env.VITE_BASE_PATH || '/',
})
