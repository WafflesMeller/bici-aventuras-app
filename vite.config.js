import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({ 
      registerType: 'autoUpdate',
      // Habilita esto para poder debugear la PWA también en modo desarrollo
      devOptions: {
        enabled: true 
      },
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png', 'icons/mask-icon.svg'], 
      manifest: {
        name: 'Biciaventuras Control Panel',
        short_name: 'Biciaventuras',
        description: 'Gestión de alquileres y pagos de Biciaventuras',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        // --- AGREGA ESTAS DOS LÍNEAS ---
        start_url: '/', 
        scope: '/',
        // ------------------------------
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true 
  }
})