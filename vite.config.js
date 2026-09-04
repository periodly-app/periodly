import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Ermöglicht Zugriff vom iPhone im selben WLAN
  },
})
