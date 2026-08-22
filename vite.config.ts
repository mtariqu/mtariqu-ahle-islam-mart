import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          category: path.resolve(__dirname, 'category.html'),
          trending: path.resolve(__dirname, 'trending.html'),
          product: path.resolve(__dirname, 'product.html'),
          admin: path.resolve(__dirname, 'admin.html'),
          adminProduct: path.resolve(__dirname, 'admin-product.html'),
          adminLogin: path.resolve(__dirname, 'admin-login.html'),
          about: path.resolve(__dirname, 'about.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          privacy: path.resolve(__dirname, 'privacy.html'),
          affiliateDisclosure: path.resolve(__dirname, 'affiliate-disclosure.html'),
          disclaimer: path.resolve(__dirname, 'disclaimer.html'),
          terms: path.resolve(__dirname, 'terms.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
