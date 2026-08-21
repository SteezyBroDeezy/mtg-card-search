import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import tailwindcss from '@tailwindcss/vite'
  import { VitePWA } from 'vite-plugin-pwa'

  export default defineConfig({
    base: '/mtg-card-search/',
    // Stamped at build time so Settings can show which build is running.
    define: {
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(
        new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
      )
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // 'prompt' (not autoUpdate) so a new version never reloads the page
        // out from under you mid-search — App.jsx shows an Update ribbon and
        // the reload happens when you tap it.
        registerType: 'prompt',
        includeAssets: ['favicon.ico'],
        manifest: {
          name: 'MTG Card Search',
          short_name: 'MTG Cards',
          description: 'Search and save Magic: The Gathering cards offline',
          theme_color: '#1f2937',
          background_color: '#111827',
          display: 'standalone',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          // Must stay false for the prompt flow: the new worker waits until
          // the ribbon's Update button sends it SKIP_WAITING.
          skipWaiting: false,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cards\.scryfall\.io\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'card-images',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ]
        }
      })
    ]
  })