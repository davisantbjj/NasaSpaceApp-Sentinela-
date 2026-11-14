import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'body/corpo.webp'],
      manifest: {
        name: 'Sentinela',
        short_name: 'Sentinela',
        description: 'Monitor de saúde para astronautas em missões longas (protótipo).',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '.',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        icons: [{ src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
