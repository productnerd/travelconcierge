import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: '/travelconcierge/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox': ['mapbox-gl', 'react-map-gl/mapbox'],
          'vendor': ['react', 'react-dom', 'zustand'],
          'data': [
            './src/data/monthlyBriefs.ts',
            './src/data/wildlife.ts',
            './src/data/regionalDishes.ts',
            './src/data/biodiversity.ts',
          ],
        },
      },
    },
  },
})
