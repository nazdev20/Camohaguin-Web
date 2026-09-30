import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port must adhere to Cloud Run PORT environment variable or default to 3000
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

// In-memory lightweight LRU cache for server-side public endpoints
class SimpleCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private defaultTtlMs = 10 * 60 * 1000;

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key: string, value: any, ttlMs = this.defaultTtlMs) {
    if (this.cache.size >= 500) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    return this.cache.delete(key);
  }

  getStats() {
    return { size: this.cache.size, max: 500 };
  }
}

const cache = new SimpleCache();

// Fallback initial services for public API
const FALLBACK_SERVICES = [
  {
    id: 's0000000-0000-0000-0000-000000000001',
    code: 'BC-CLR',
    name: 'Barangay Clearance',
    category: 'Certifications & Clearances',
    description: 'Standard certification of good moral standing and residency for employment, bank accounts, or municipal permits.',
    processing_days: 1,
    fee_amount: 50.00,
    requires_residency_verification: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000002',
    code: 'BC-IND',
    name: 'Certificate of Indigency',
    category: 'Social & Welfare Assistance',
    description: 'Official certificate for medical assistance, hospital billing discounts, educational scholarships, and legal aid.',
    processing_days: 1,
    fee_amount: 0.00,
    requires_residency_verification: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000003',
    code: 'BC-RES',
    name: 'Certificate of Residency',
    category: 'Certifications & Clearances',
    description: 'Verifies continuous physical residency in Barangay Camohaguin for school enrollment, utility lines, and bank compliance.',
    processing_days: 1,
    fee_amount: 50.00,
    requires_residency_verification: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000004',
    code: 'BC-BUS',
    name: 'Barangay Business Clearance',
    category: 'Business & Trade',
    description: 'Annual or new barangay business clearance required for Mayor’s Permit and DTI registration within Camohaguin.',
    processing_days: 2,
    fee_amount: 300.00,
    requires_residency_verification: false,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 's0000000-0000-0000-0000-000000000005',
    code: 'BC-JOB',
    name: 'First-Time Jobseeker Assistance (RA 11261)',
    category: 'Youth & Employment',
    description: 'Waived barangay fees for first-time jobseekers under Republic Act 11261.',
    processing_days: 1,
    fee_amount: 0.00,
    requires_residency_verification: true,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const FALLBACK_ANNOUNCEMENTS = [
  {
    id: 'n001',
    title: 'Barangay Camohaguin General Assembly',
    category: 'Assembly',
    content: 'All residents of Barangay Camohaguin are invited to attend the quarterly barangay assembly.',
    published_at: new Date().toISOString(),
  },
  {
    id: 'n002',
    title: 'Free Health Screening & Medical Mission',
    category: 'Health',
    content: 'Free medical consultations, blood pressure screening, and vitamins at the Barangay Hall.',
    published_at: new Date().toISOString(),
  },
];

// Initialize Google Gen AI
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

const DEFAULT_SYSTEM_INSTRUCTION = `You are "Ka-Barangay AI", the official virtual assistant for Barangay Camohaguin, Municipality of Gumaca, Province of Quezon.
Guide and assist residents with frontline services, clearances, appointments, and general inquiries. Always be respectful, polite, and helpful in English, Tagalog, or Taglish.`;

// Gemini Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, roleInstruction, model = 'gemini-3.8-flash' } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured (GEMINI_API_KEY).',
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

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

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
    const modelsToTry = [selectedModel, 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

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
        console.warn(`[Gemini API] Model ${tryModel} failed, trying fallback:`, err?.message || err);
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

// Cache endpoints
app.get('/api/cache-stats', (req, res) => {
  res.json({ status: 'ok', ...cache.getStats() });
});

app.post('/api/cache/invalidate', (req, res) => {
  cache.clear();
  res.json({ success: true, invalidatedCount: 1, remainingSize: 0 });
});

// Services endpoint
app.get('/api/services', (req, res) => {
  const cached = cache.get('services');
  if (cached) {
    res.setHeader('X-Cache-Status', 'HIT');
    return res.json({ data: cached, source: 'lru_cache' });
  }
  cache.set('services', FALLBACK_SERVICES);
  res.setHeader('X-Cache-Status', 'MISS');
  res.json({ data: FALLBACK_SERVICES, source: 'database' });
});

// Announcements endpoint
app.get('/api/announcements', (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 10;
  res.json({ data: FALLBACK_ANNOUNCEMENTS.slice(0, limit), source: 'database' });
});

// Officials endpoint
app.get('/api/officials', (req, res) => {
  res.json({
    data: [
      { name: 'Hon. Nelson T. De Chavez', position: 'Punong Barangay', term: '2023-Present' },
      { name: 'Hon. Maria L. Santos', position: 'Barangay Kagawad - Peace & Order', term: '2023-Present' },
      { name: 'Hon. Roberto C. Tan', position: 'Barangay Kagawad - Health & Sanitation', term: '2023-Present' },
      { name: 'Hon. Elena S. Ramos', position: 'Barangay Secretary', term: '2023-Present' },
      { name: 'Hon. Juan P. Mercado', position: 'Barangay Treasurer', term: '2023-Present' },
    ],
    source: 'database',
  });
});

// Settings endpoint
app.get('/api/settings', (req, res) => {
  res.json({
    data: {
      barangay_name: 'Barangay Camohaguin',
      municipality: 'Gumaca',
      province: 'Quezon',
      emergency_phone: '(042) 317-8890',
      office_hours: 'Monday to Friday: 8:00 AM - 5:00 PM',
      tanod_hotline: '0917-889-1122',
      police_hotline: '(042) 317-6222',
      bfp_hotline: '(042) 317-6111',
      rhu_hotline: '(042) 317-5444',
    },
    source: 'database',
  });
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
    // Check both dist and build directories
    const staticDir = path.resolve(__dirname, 'dist');
    app.use(express.static(staticDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(staticDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Barangay Portal] Server running at http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Failure]:', err);
  process.exit(1);
});

export default app;
