import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Publicado como GitHub Pages de projeto (owner.github.io/Watch-Look-app),
// então o build de produção precisa desse prefixo; `npm run dev` continua na raiz.
const base = process.env.GITHUB_PAGES === 'true' ? '/Watch-Look-app/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Watch & Look',
        short_name: 'Watch & Look',
        description: 'Escolha um relógio da sua coleção e veja sugestões de look, ou monte seu look e veja qual relógio combina.',
        theme_color: '#0b0b0d',
        background_color: '#0a0a0b',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${base}icon-512-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    setupFiles: ['./src/test-setup.js'],
  },
})
