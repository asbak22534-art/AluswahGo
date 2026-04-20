import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        filename: 'OneSignalSDKWorker.js',
        registerType: 'prompt',
        injectRegister: 'script',
        workbox: {
          importScripts: ["https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js"],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        },
        includeAssets: ['logo.png', 'apple-touch-icon-180x180.png', 'pwa-192x192.png', 'pwa-512x512.png', 'maskable-icon-512x512.png'],
        manifest: {
          name: 'MIS IT Al Uswah',
          short_name: 'MIS IT Al Uswah',
          description: 'Portal Sekolah MIS IT Al Uswah',
          theme_color: '#0d9488',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          id: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
