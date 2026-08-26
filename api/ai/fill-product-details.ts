import { generateProductDetails } from '../../src/server/gemini.js';

export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid JSON payload received in request body.' });
      }
    }

    const { images, existingName, existingCategory, customPrompt, affiliateUrl } = body || {};

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one product image is required for AI auto-fill.' });
    }

    const data = await generateProductDetails({
      images,
      existingName,
      existingCategory,
      customPrompt,
      affiliateUrl,
    });

    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('Error in Vercel AI auto-fill API:', err);
    let clientMsg = err?.message || 'Failed to analyze product image with AI.';
    if (typeof clientMsg === 'string' && (clientMsg.includes('503') || clientMsg.includes('high demand') || clientMsg.includes('UNAVAILABLE'))) {
      clientMsg = 'Google AI model is experiencing high demand. Please click "Generate All Details" to retry in a moment.';
    }
    return res.status(500).json({
      success: false,
      error: clientMsg,
    });
  }
}
