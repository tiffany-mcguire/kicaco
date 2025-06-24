import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'manifest.json'],
      manifest: {
        name: 'Kicaco - Family Assistant',
        short_name: 'Kicaco',
        description: 'Smart family calendar and assistant that helps organize your family\'s schedule',
        theme_color: '#217e8f',
        background_color: '#217e8f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: '32x32',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/share',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        categories: ['productivity', 'lifestyle', 'utilities']
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openai\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'openai-api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: true, // Allow external connections
    port: 5173,
    // Enable HTTPS with mkcert certificates for clipboard API support
    https: {
      key: readFileSync('./certs/localhost+4-key.pem'),
      cert: readFileSync('./certs/localhost+4.pem')
    }
  },
  preview: {
    host: true, // Allow external connections
    port: 4173,
    https: {
      key: readFileSync('./certs/localhost+4-key.pem'),
      cert: readFileSync('./certs/localhost+4.pem')
    }
  }
})
