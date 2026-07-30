import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/portfolio/demos/spline/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
