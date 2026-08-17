import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static, client-side only — no backend. Deploys as-is to Vercel or GitHub Pages.
export default defineConfig({
  plugins: [react()],
})
