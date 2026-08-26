import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 50MB payloads for multiple high-res product photos (base64)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize Gemini SDK with User-Agent header as required
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Product Analysis & Auto-fill Endpoint (in Hinglish)
  app.post('/api/ai/fill-product-details', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in Settings > Secrets.',
        });
      }

      const { images, existingName, existingCategory, customPrompt, affiliateUrl } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'At least one product image is required for AI auto-fill.' });
      }

      const contentsParts: any[] = [];

      // Process up to 3 images for balanced visual analysis and lightweight payload
      for (let i = 0; i < Math.min(images.length, 3); i++) {
        const img = images[i];
        if (typeof img === 'string') {
          if (img.startsWith('data:')) {
            const match = img.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              contentsParts.push({
                inlineData: {
                  mimeType: match[1],
                  data: match[2],
                },
              });
            }
          } else if (img.startsWith('http://') || img.startsWith('https://')) {
            try {
              const fetchRes = await fetch(img);
              if (fetchRes.ok) {
                const arrayBuffer = await fetchRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const mime = fetchRes.headers.get('content-type') || 'image/jpeg';
                contentsParts.push({
                  inlineData: {
                    mimeType: mime,
                    data: buffer.toString('base64'),
                  },
                });
              }
            } catch (e) {
              console.warn('Could not fetch image URL for AI inspection:', img, e);
            }
          }
        }
      }

      if (contentsParts.length === 0) {
        return res.status(400).json({
          error: 'Could not parse provided image(s). Please upload a valid JPG/PNG/WEBP file or direct image URL.',
        });
      }

      const systemPrompt = `You are a professional e-commerce product catalog manager and copywriter for "Apna Mart", a premier Indian online affiliate shopping marketplace selling across all states of India (Pan-India).
The user has uploaded photo(s) of a product. Carefully analyze the visuals to identify what the product is, its materials, design features, colors, practical utility, build quality, and estimated market price in India (in Indian Rupees ₹).

CRITICAL REQUIREMENT - PAN-INDIA DESI INDIAN ENGLISH:
All descriptive text (name, shortDescription, description, features, featuresAndBenefits, whyBuy, buyingGuide, faqs, pros, cons, finalVerdict, metaDescription) MUST BE WRITTEN IN CLEAR, NATURAL, POLISHED DESI INDIAN ENGLISH.
- Indian English is standard for e-commerce buyers across North, South, East, and West India.
- Keep the tone engaging, helpful, informative, and tailored for Indian families and smart online shoppers.
- Highlight product durability, comfort for Indian conditions, build quality, and great value for money in Rupees (₹).
- Do NOT use Roman Hindi / Hinglish. Write in authentic, clean, grammatically sound Indian e-commerce English.

The available category slugs are:
- men (Men's Fashion, Casual Shirts, T-Shirts, Trousers, Ethnic Wear, Footwear, Watches)
- women (Women's Fashion, Sarees, Kurtis, Dresses, Handbags, Jewelry, Footwear)
- electronics (Smartphones, Smartwatches, Earbuds, Headphones, Bluetooth Speakers, Gadgets)
- home-kitchen (Cookware, Kitchen Appliances, Storage, Dining, Utility)
- beauty-personal-care (Skincare, Haircare, Perfumes, Grooming Kits, Makeup)
- home-decor (Wall Art, Clocks, Table Lamps, Curtains, Cushions, Showpieces)
- sports-fitness (Gym Equipment, Yoga Mats, Dumbbells, Activewear, Water Bottles)
- baby-kids (Kids Clothing, Toys, Educational Games, Baby Care)
- books-stationery (Bestsellers, Self-help, Novels, Planners, Notebooks, Art Supplies)
- automotive (Car Accessories, Bike Accessories, Cleaning Kits, Phone Mounts)

Select the most accurate category from the list above.
Provide realistic Indian pricing in ₹ (e.g. price: "₹899", oldPrice: "₹1,499").
`;

      const promptText = `Analyze the uploaded product image(s). ${existingName ? `Current title: "${existingName}". ` : ''}${existingCategory ? `Current category: "${existingCategory}". ` : ''}${affiliateUrl ? `Affiliate source link provided: "${affiliateUrl}". ` : ''}${customPrompt ? `Admin note/instructions: "${customPrompt}". ` : ''}

Generate all product details in Indian English in structured JSON format according to the schema.`;

      contentsParts.push({ text: promptText });

      const schemaConfig = {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Product Title in descriptive Indian English (e.g. "Premium 100% Cotton Casual Men\'s Slim Fit Shirt - Breathable & Stylish")',
          },
          category: {
            type: Type.STRING,
            description: 'One of the exact category slugs (e.g. "men", "women", "electronics", "home-kitchen", "beauty-personal-care", "home-decor", "sports-fitness", "baby-kids", "books-stationery", "automotive")',
          },
          productType: {
            type: Type.STRING,
            description: 'Subtype matching the item (e.g. "Casual Shirt", "Smartwatch", "Non-Stick Cookware Set", "Wireless Earbuds")',
          },
          brand: {
            type: Type.STRING,
            description: 'Respected manufacturer name or "Apna Mart Choice" / "Handcrafted / Artisan Choice" / Top Retail Brand',
          },
          rating: {
            type: Type.NUMBER,
            description: 'Rating between 4.5 and 5.0 (e.g. 4.8)',
          },
          price: {
            type: Type.STRING,
            description: 'Current offer price with ₹ symbol (e.g. "₹899")',
          },
          oldPrice: {
            type: Type.STRING,
            description: 'Original MRP with ₹ symbol (e.g. "₹1,499")',
          },
          shortDescription: {
            type: Type.STRING,
            description: '1-2 sentence concise summary in Indian English explaining key value and comfort.',
          },
          description: {
            type: Type.STRING,
            description: 'Detailed 2-3 paragraph product overview in Indian English describing fabric/materials, finish, design, and practical utility.',
          },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '4 to 6 key bullet points in Indian English highlighting materials, design, finish, and durability.',
          },
          featuresAndBenefits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feature: { type: Type.STRING, description: 'Feature in Indian English' },
                benefit: { type: Type.STRING, description: 'Direct benefit to the buyer in Indian English' },
              },
              required: ['feature', 'benefit'],
            },
            description: '3 to 5 Feature-Benefit pairs in Indian English',
          },
          specifications: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                key: {
                  type: Type.STRING,
                  description: 'Specification attribute name in Indian English (e.g. "Material / Fabric", "Fit Type", "Color / Shade", "Pattern / Design", "Care Instructions", "Occasion", "Country of Origin", "Net Weight")',
                },
                value: {
                  type: Type.STRING,
                  description: 'Specification value in Indian English (e.g. "100% Pure Breathable Cotton", "Regular Comfort Fit", "Pure White with Subtle Sheen", "Solid Plain / Embroidered Neckline", "Gentle Hand or Machine Wash", "Daily Salah, Jummah & Eid", "India", "350 grams")',
                },
              },
              required: ['key', 'value'],
            },
            description: '5 to 8 detailed technical specification key-value pairs in Indian English',
          },
          whyBuy: {
            type: Type.OBJECT,
            properties: {
              advantages: { type: Type.STRING, description: 'Why buy advantages in Indian English' },
              useCases: { type: Type.STRING, description: 'Primary use cases in Indian English (Daily Salah, Jummah, Eid, etc.)' },
            },
            required: ['advantages', 'useCases'],
          },
          buyingGuide: {
            type: Type.OBJECT,
            properties: {
              whoShouldBuy: { type: Type.STRING, description: 'Who should buy this in Indian English' },
              considerations: { type: Type.STRING, description: 'Important buying tips in Indian English (sizing, care, etc.)' },
            },
            required: ['whoShouldBuy', 'considerations'],
          },
          faqs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'Frequently asked question in Indian English' },
                answer: { type: Type.STRING, description: 'Clear, helpful answer in Indian English' },
              },
              required: ['question', 'answer'],
            },
            description: '3 to 4 FAQs with questions and answers in Indian English',
          },
          pros: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 5 positives/pros in Indian English',
          },
          cons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '1 to 2 honest considerations in Indian English',
          },
          finalVerdict: {
            type: Type.STRING,
            description: 'Final buying recommendation in Indian English',
          },
          metaTitle: {
            type: Type.STRING,
            description: 'SEO Meta title under 60 characters',
          },
          focusKeywords: {
            type: Type.STRING,
            description: 'Focus keywords separated by commas',
          },
          metaDescription: {
            type: Type.STRING,
            description: 'SEO Meta description under 160 characters in Indian English',
          },
          ctaText: {
            type: Type.STRING,
            description: 'Call to action text (e.g. "Check Price on Amazon" or "Buy on Flipkart")',
          },
          isTrending: {
            type: Type.BOOLEAN,
            description: 'True if product has high viral / trending appeal',
          },
          hotDeal: {
            type: Type.BOOLEAN,
            description: 'True if suitable for daily hot deal',
          },
        },
        required: [
          'name',
          'category',
          'productType',
          'brand',
          'rating',
          'price',
          'oldPrice',
          'shortDescription',
          'description',
          'features',
          'featuresAndBenefits',
          'specifications',
          'whyBuy',
          'buyingGuide',
          'faqs',
          'pros',
          'cons',
          'finalVerdict',
          'metaTitle',
          'metaDescription',
        ],
      };

      // Model candidate list with fallback hierarchy in case of temporary 503 high-demand surges
      const modelCandidates = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let lastError: any = null;
      let parsedData: any = null;

      for (const modelName of modelCandidates) {
        // Try up to 2 attempts per candidate with backoff
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[AI Auto-Fill] Attempting generation with model ${modelName} (attempt ${attempt})...`);
            const response = await ai.models.generateContent({
              model: modelName,
              contents: { parts: contentsParts },
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: schemaConfig,
              },
            });

            const jsonText = response.text?.trim() || '{}';
            parsedData = JSON.parse(jsonText);
            break; // Success!
          } catch (modelErr: any) {
            lastError = modelErr;
            const errMsg = String(modelErr?.message || modelErr);
            console.warn(`[AI Auto-Fill] Model ${modelName} attempt ${attempt} failed:`, errMsg);

            const isHighDemandOrUnavailable =
              errMsg.includes('503') ||
              errMsg.includes('high demand') ||
              errMsg.includes('UNAVAILABLE') ||
              errMsg.includes('Resource has been exhausted') ||
              errMsg.includes('429');

            if (isHighDemandOrUnavailable && attempt < 2) {
              // Wait 1.5 seconds before retrying same model
              await new Promise((resolve) => setTimeout(resolve, 1500));
            } else {
              // Move to next candidate model
              break;
            }
          }
        }

        if (parsedData) {
          break; // Got valid response
        }
      }

      if (!parsedData) {
        throw lastError || new Error('Google Gemini models are temporarily experiencing high demand. Please retry in a few seconds.');
      }

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Error generating product details with AI:', err);
      let clientMsg = err.message || 'Failed to analyze product image with AI.';
      if (typeof clientMsg === 'string' && (clientMsg.includes('503') || clientMsg.includes('high demand') || clientMsg.includes('UNAVAILABLE'))) {
        clientMsg = 'Google AI model is experiencing high demand. Automatic fallback also timed out. Please click "Generate All Details" to retry.';
      }
      return res.status(500).json({
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
