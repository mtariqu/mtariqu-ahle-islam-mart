import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function htmlComponentsPlugin(): Plugin {
  return {
    name: 'html-components-plugin',
    // Ensure header.html and footer.html exist in public folder for static fetch
    buildStart() {
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const headerPath = path.resolve(__dirname, 'header.html');
      const footerPath = path.resolve(__dirname, 'footer.html');
      if (fs.existsSync(headerPath)) {
        fs.copyFileSync(headerPath, path.resolve(publicDir, 'header.html'));
      }
      if (fs.existsSync(footerPath)) {
        fs.copyFileSync(footerPath, path.resolve(publicDir, 'footer.html'));
      }
    },
    // Watch header.html and footer.html for live changes
    handleHotUpdate({ file, server }) {
      if (file.endsWith('header.html') || file.endsWith('footer.html')) {
        const publicDir = path.resolve(__dirname, 'public');
        const fileName = path.basename(file);
        fs.copyFileSync(file, path.resolve(publicDir, fileName));
        server.ws.send({ type: 'full-reload' });
      }
    },
    // Transform HTML pages to insert header and footer content dynamically
    transformIndexHtml(html) {
      let transformed = html;
      const headerPath = path.resolve(__dirname, 'header.html');
      const footerPath = path.resolve(__dirname, 'footer.html');

      if (fs.existsSync(headerPath)) {
        const headerContent = fs.readFileSync(headerPath, 'utf8');
        // Replace empty header container with header.html content
        transformed = transformed.replace(
          /<div\s+id=["']global-header["']><\/div>/gi,
          `<div id="global-header">${headerContent}</div>`
        );
      }

      if (fs.existsSync(footerPath)) {
        const footerContent = fs.readFileSync(footerPath, 'utf8');
        // Replace empty footer container with footer.html content
        transformed = transformed.replace(
          /<div\s+id=["']global-footer["']><\/div>/gi,
          `<div id="global-footer">${footerContent}</div>`
        );
      }

      return transformed;
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      htmlComponentsPlugin()
    ],
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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
