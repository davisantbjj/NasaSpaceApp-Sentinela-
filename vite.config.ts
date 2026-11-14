import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png', 'body/corpo.webp', 'body/corpo-feminino.webp'],
      manifest: {
        name: 'Sentinela',
        short_name: 'Sentinela',
        description: 'Monitor de saúde para astronautas em missões longas (protótipo).',
        lang: 'pt-BR',
        display: 'standalone',
        start_url: '.',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        // PNG de 192 e 512 px: o Chrome e o Edge só oferecem "Instalar app" com eles.
        // O maskable tem o fundo no quadrado inteiro, e o Android recorta no formato do aparelho.
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
