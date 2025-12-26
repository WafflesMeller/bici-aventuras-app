import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true 
      },
      // --- AGREGAR ESTE BLOQUE ---
      workbox: {
        navigateFallbackDenylist: [/^\/api/]
      },
      // ---------------------------
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png', 'icons/mask-icon.svg'], 
      manifest: {
        name: 'Biciaventuras Control Panel',
        short_name: 'Biciaventuras',
        description: 'Gestión de alquileres y pagos de Biciaventuras',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/', 
        scope: '/',
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