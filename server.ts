import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { generateProductDetails } from './src/server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 50MB payloads for multiple high-res product photos (base64)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS middleware for local API access
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Product Analysis & Auto-fill Endpoint
  app.post('/api/ai/fill-product-details', async (req, res) => {
    try {
      const { images, existingName, existingCategory, customPrompt, affiliateUrl } = req.body || {};

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'At least one product image is required for AI auto-fill.' });
      }

      const parsedData = await generateProductDetails({
        images,
        existingName,
        existingCategory,
        customPrompt,
        affiliateUrl,
      });

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Error generating product details with AI:', err);
      let clientMsg = err.message || 'Failed to analyze product image with AI.';
      if (typeof clientMsg === 'string' && (clientMsg.includes('503') || clientMsg.includes('high demand') || clientMsg.includes('UNAVAILABLE'))) {
        clientMsg = 'Google AI model is experiencing high demand. Please click "Generate All Details" to retry.';
      }
      return res.status(500).json({
        success: false,
        error: clientMsg,
      });
    }
  });

  // Vite middleware in dev mode, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
