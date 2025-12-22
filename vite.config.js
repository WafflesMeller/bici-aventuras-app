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
      // CORRECCIÓN: Asegúrate de que los assets apunten a la subcarpeta icons si ahí están
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png', 'icons/mask-icon.svg'], 
      manifest: {
        name: 'Biciaventuras Control Panel',
        short_name: 'Biciaventuras',
        description: 'Gestión de alquileres y pagos de Biciaventuras',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone', // Esto hace que se vea como una app sin barra de navegador
        orientation: 'portrait',
        icons: [
        {
          src: 'icons/icon-192x192.png', // Cambiado de pwa- a icon-
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icons/icon-512x512.png', // Cambiado de pwa- a icon-
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
    host: true // Esto permite que veas la app desde tu celular usando la IP de tu PC
  }
})