import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_SYSTEM_INSTRUCTION = `You are "Ka-Barangay AI", the official virtual assistant for Barangay Camohaguin, Municipality of Gumaca, Province of Quezon.
Your role is to guide and assist residents, business owners, and visitors with:
1. Available frontline barangay services (Barangay Clearance, Certificate of Indigency, Certificate of Residency, Business Clearance, First-Time Jobseeker Assistance, Building Clearance).
2. Requirements, processing times, standard fees, and appointment scheduling.
3. Tracking submitted requests and explaining status stages (Submitted, Under Review, For Correction, Approved, Ready for Release, Completed).
4. Purok information (Purok 1 through Purok 7), barangay officials, and office hours (Mon-Fri 8:00 AM - 5:00 PM).
5. Katarungang Pambarangay (Lupon Tagapamayapa) dispute mediation guidelines and peace & order reporting.
6. Emergency hotlines (Barangay Tanod Command, Gumaca Police, Bureau of Fire Protection, Rural Health Unit).

Personality: Courteous, respectful, highly informative, clear, and reassuring. Speak in English, Tagalog, or natural Taglish as appropriate for Philippine local governance. Always encourage residents to use the portal to file applications or schedule their appointments.`;

const allowedModels = [
  "gemini-3.1-pro-preview",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
];

export async function POST(request: Request) {
  let body: {
    messages?: { role: string; content: string }[];
    roleInstruction?: string;
    model?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { messages, roleInstruction, model = "gemini-3.8-flash" } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages array is required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY environment variable is not configured." },
      { status: 503 },
    );
  }

  const selectedModel = model === "gemini-3.5-flash" || !allowedModels.includes(model)
    ? "gemini-3.8-flash"
    : model;
  const systemInstruction = roleInstruction
    ? `${DEFAULT_SYSTEM_INSTRUCTION}\n\nSpecific Role Mode: ${roleInstruction}`
    : DEFAULT_SYSTEM_INSTRUCTION;
  const aiClient = new GoogleGenAI({ apiKey });
  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content || "" }],
  }));

  let lastError: unknown;
  for (const tryModel of [...new Set([selectedModel, "gemini-3.1-flash-lite", "gemini-2.5-flash"])]) {
    try {
      const response = await aiClient.models.generateContent({
        model: tryModel,
        contents,
        config: { systemInstruction, temperature: 0.7 },
      });

      if (response.text) {
        return NextResponse.json({
          role: "assistant",
          content: response.text,
          model: tryModel,
        });
      }
    } catch (error) {
      lastError = error;
      console.warn(`[Gemini API] Model ${tryModel} failed; trying fallback.`, error);
    }
  }

  console.error("[Gemini API] All configured models failed.", lastError);
  return NextResponse.json(
    { error: "Failed to generate response from Gemini API." },
    { status: 502 },
  );
}