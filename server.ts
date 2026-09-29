import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { serverLruCache, CacheKeys } from './src/lib/lruCache';
import { INITIAL_SERVICES, INITIAL_ANNOUNCEMENTS } from './src/services/mockData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI with required telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System instruction for Barangay Camohaguin virtual assistant
const DEFAULT_SYSTEM_INSTRUCTION = `You are "Ka-Barangay AI", the official virtual assistant for Barangay Camohaguin, Municipality of Gumaca, Province of Quezon.
Your role is to guide and assist residents, business owners, and visitors with:
1. Available frontline barangay services (Barangay Clearance, Certificate of Indigency, Certificate of Residency, Business Clearance, First-Time Jobseeker Assistance, Building Clearance).
2. Requirements, processing times, standard fees, and appointment scheduling.
3. Tracking submitted requests and explaining status stages (Submitted, Under Review, For Correction, Approved, Ready for Release, Completed).
4. Purok information (Purok 1 through Purok 7), barangay officials, and office hours (Mon-Fri 8:00 AM - 5:00 PM).
5. Katarungang Pambarangay (Lupon Tagapamayapa) dispute mediation guidelines and peace & order reporting.
6. Emergency hotlines (Barangay Tanod Command, Gumaca Police, Bureau of Fire Protection, Rural Health Unit).

Personality: Courteous, respectful, highly informative, clear, and reassuring. Speak in English, Tagalog, or natural Taglish as appropriate for Philippine local governance. Always encourage residents to use the portal to file applications or schedule their appointments.`;

// Gemini Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, roleInstruction, model = 'gemini-3.5-flash' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Check if API key is present
    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in environment secrets (GEMINI_API_KEY).',
      });
    }

    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: currentApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }

    // Format conversation history for @google/genai
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Map requested models to valid @google/genai endpoints
    let selectedModel = model;
    if (selectedModel === 'gemini-3.5-flash') {
      selectedModel = 'gemini-3.8-flash';
    } else if (!['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'].includes(selectedModel)) {
      selectedModel = 'gemini-3.8-flash';
    }

    const systemInstruction = roleInstruction
      ? `${DEFAULT_SYSTEM_INSTRUCTION}\n\nSpecific Role Mode: ${roleInstruction}`
      : DEFAULT_SYSTEM_INSTRUCTION;

    let replyText = '';
    const modelsToTry = [selectedModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

    let lastError: any = null;
    for (const tryModel of Array.from(new Set(modelsToTry))) {
      try {
        const response = await aiClient.models.generateContent({
          model: tryModel,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response.text) {
          replyText = response.text;
          selectedModel = tryModel;
          lastError = null;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Model ${tryModel} failed, trying fallback:`, err.message || err);
      }
    }

    if (lastError && !replyText) {
      throw lastError;
    }

    return res.json({
      role: 'assistant',
      content: replyText || 'I apologize, but I could not generate a response. Please try again.',
      model: selectedModel,
    });
  } catch (error: any) {
    console.error('[Gemini API Server Error]:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate response from Gemini API.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------------------------------
// LRU Cached Public Endpoints
// - Cache Scope: Public & shared stable data only
// - Excluded from LRU: Resident PII, requests, appointments, sessions
// --------------------------------------------------------------------------

// Cache diagnostic & inspection endpoint
app.get('/api/cache-stats', (req, res) => {
  const stats = serverLruCache.getStats();
  res.json({
    status: 'ok',
    ...stats,
  });
});

// Cache invalidation endpoint (Called upon admin mutations)
app.post('/api/cache/invalidate', (req, res) => {
  const { key, prefix } = req.body || {};
  let invalidatedCount = 0;

  if (prefix) {
    invalidatedCount = serverLruCache.invalidatePrefix(prefix);
    console.log(`[LRU Cache Invalidation] Cleared ${invalidatedCount} keys with prefix: "${prefix}"`);
  } else if (key) {
    const deleted = serverLruCache.delete(key);
    invalidatedCount = deleted ? 1 : 0;
    console.log(`[LRU Cache Invalidation] Cleared key: "${key}"`);
  } else {
    serverLruCache.clear();
    console.log('[LRU Cache Invalidation] Cleared entire cache');
  }

  res.json({
    success: true,
    invalidatedCount,
    remainingSize: serverLruCache.getStats().size,
  });
});

// Public Services (LRU Cached: 10 min TTL)
app.get('/api/services', async (req, res) => {
  try {
    const cacheKey = CacheKeys.publicServices();
    const isCached = serverLruCache.has(cacheKey);

    const services = await serverLruCache.wrap(
      cacheKey,
      async () => {
        // Return active services from mock or DB
        return INITIAL_SERVICES;
      },
      10 * 60 * 1000 // 10 minutes TTL
    );

    res.setHeader('X-Cache-Status', isCached ? 'HIT' : 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.json({ data: services, source: isCached ? 'lru_cache' : 'database' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch services.' });
  }
});

// Public Announcements (LRU Cached: 10 min TTL)
app.get('/api/announcements', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const cacheKey = CacheKeys.publicAnnouncements(limit);
    const isCached = serverLruCache.has(cacheKey);

    const announcements = await serverLruCache.wrap(
      cacheKey,
      async () => {
        return INITIAL_ANNOUNCEMENTS.slice(0, limit);
      },
      10 * 60 * 1000
    );

    res.setHeader('X-Cache-Status', isCached ? 'HIT' : 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({ data: announcements, source: isCached ? 'lru_cache' : 'database' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch announcements.' });
  }
});

// Public Officials Directory (LRU Cached: 10 min TTL)
app.get('/api/officials', async (req, res) => {
  try {
    const cacheKey = CacheKeys.publicOfficials();
    const isCached = serverLruCache.has(cacheKey);

    const officials = await serverLruCache.wrap(
      cacheKey,
      async () => {
        return [
          { name: 'Hon. Nelson T. De Chavez', position: 'Punong Barangay', term: '2023-Present' },
          { name: 'Hon. Maria L. Santos', position: 'Barangay Kagawad - Peace & Order', term: '2023-Present' },
          { name: 'Hon. Roberto C. Tan', position: 'Barangay Kagawad - Health & Sanitation', term: '2023-Present' },
          { name: 'Hon. Elena S. Ramos', position: 'Barangay Secretary', term: '2023-Present' },
          { name: 'Hon. Juan P. Mercado', position: 'Barangay Treasurer', term: '2023-Present' },
        ];
      },
      10 * 60 * 1000
    );

    res.setHeader('X-Cache-Status', isCached ? 'HIT' : 'MISS');
    res.json({ data: officials, source: isCached ? 'lru_cache' : 'database' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch officials.' });
  }
});

// Site Settings & Hotline (LRU Cached: 10 min TTL)
app.get('/api/settings', async (req, res) => {
  try {
    const cacheKey = CacheKeys.siteSettings();
    const isCached = serverLruCache.has(cacheKey);

    const settings = await serverLruCache.wrap(
      cacheKey,
      async () => {
        return {
          barangay_name: 'Barangay Camohaguin',
          municipality: 'Gumaca',
          province: 'Quezon',
          emergency_phone: '(042) 317-8890',
          office_hours: 'Monday to Friday: 8:00 AM - 5:00 PM',
          tanod_hotline: '0917-889-1122',
          police_hotline: '(042) 317-6222',
          bfp_hotline: '(042) 317-6111',
          rhu_hotline: '(042) 317-5444',
        };
      },
      10 * 60 * 1000
    );

    res.setHeader('X-Cache-Status', isCached ? 'HIT' : 'MISS');
    res.json({ data: settings, source: isCached ? 'lru_cache' : 'database' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch settings.' });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Barangay Portal] Server running at http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Failure]:', err);
});
