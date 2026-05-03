import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'QuickScan',
        short_name: 'QuickScan',
        description: 'Mobile-first document scanner PWA',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        // Only cache JS, CSS, HTML, and specific static assets.
        // DO NOT cache images (.jpg, .png, .jpeg) or documents (.pdf) 
        // to prevent sensitive data from persisting in the Service Worker Cache Storage.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        runtimeCaching: []
      }
    })
  ],
})
