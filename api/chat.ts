import { GoogleGenAI } from '@google/genai';

const DEFAULT_SYSTEM_INSTRUCTION = `You are "Ka-Barangay AI", the official virtual assistant for Barangay Camohaguin, Municipality of Gumaca, Province of Quezon.
Your role is to guide and assist residents, business owners, and visitors with:
1. Available frontline barangay services (Barangay Clearance, Certificate of Indigency, Certificate of Residency, Business Clearance, First-Time Jobseeker Assistance, Building Clearance).
2. Requirements, processing times, standard fees, and appointment scheduling.
3. Tracking submitted requests and explaining status stages (Submitted, Under Review, For Correction, Approved, Ready for Release, Completed).
4. Purok information (Purok 1 through Purok 7), barangay officials, and office hours (Mon-Fri 8:00 AM - 5:00 PM).
5. Katarungang Pambarangay (Lupon Tagapamayapa) dispute mediation guidelines and peace & order reporting.
6. Emergency hotlines (Barangay Tanod Command, Gumaca Police, Bureau of Fire Protection, Rural Health Unit).

Personality: Courteous, respectful, highly informative, clear, and reassuring. Speak in English, Tagalog, or natural Taglish as appropriate for Philippine local governance. Always encourage residents to use the portal to file applications or schedule their appointments.`;

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid JSON body.' });
      }
    }

    const { messages, roleInstruction, model = 'gemini-3.8-flash' } = body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY environment variable is not configured in Vercel settings.',
      });
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
        console.warn(`[Gemini Vercel] Model ${tryModel} failed, trying fallback:`, err?.message || err);
      }
    }

    if (lastError && !replyText) {
      console.error('[Gemini Vercel Execution Error]:', lastError);
      return res.status(502).json({
        error: lastError?.message || 'Gemini API call failed.',
      });
    }

    return res.status(200).json({
      role: 'assistant',
      content: replyText || 'Magandang araw! Ako si Ka-Barangay AI. Paano po kita matutulungan ngayong araw?',
      model: selectedModel,
    });
  } catch (err: any) {
    console.error('[Vercel Handler Error]:', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error in /api/chat handler.',
    });
  }
}
