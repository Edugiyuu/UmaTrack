import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site under /<repo>/; the deploy workflow sets BASE_PATH.
  // Locally it stays at the root.
  base: process.env.BASE_PATH || '/',
  // A preview tool may assign the port through PORT; otherwise Vite's default (5173).
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : undefined,
})
