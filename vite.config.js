import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    VitePWA({
      registerType: 'prompt', // Controlled update prompt to prevent race conditions or forced page reloads
      manifest: {
        id: '/?source=pwa', // Locks launch identity path
        name: 'QuickScan - Mobile Document Scanner',
        short_name: 'QuickScan',
        description: 'Immersive, local-only document scanner and high-quality PDF exporter.',
        theme_color: '#0c1510', // Brand slate background
        background_color: '#0c1510',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/?source=pwa',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Safe document privacy: Only cache static application shell assets
        // Excludes temporary blobs, base64 data, dynamic images, and PDF binaries from persistent SW caching
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        runtimeCaching: [],
        cleanupOutdatedCaches: true // Safe auto-cleanup of old cache caches
      }
    })
  ],
})
