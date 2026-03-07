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
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'MIS IT Al Uswah',
          short_name: 'Al Uswah',
          description: 'Portal Sekolah MIS IT Al Uswah Pasirian',
          theme_color: '#0d9488',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'https://lh3.googleusercontent.com/a/ACg8ocLjDVk3HM6HfZrRk4kJAwJveT-6ZvIEr97Ky1y_vL0a2L6Nhd4=s400-c',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://lh3.googleusercontent.com/a/ACg8ocLjDVk3HM6HfZrRk4kJAwJveT-6ZvIEr97Ky1y_vL0a2L6Nhd4=s400-c',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://lh3.googleusercontent.com/a/ACg8ocLjDVk3HM6HfZrRk4kJAwJveT-6ZvIEr97Ky1y_vL0a2L6Nhd4=s400-c',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
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
