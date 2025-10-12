import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-pro" });
console.log("🔑 GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);

export async function summarizeText(text: string): Promise<string> {
  try {
    const prompt = `Summarize this news in 2-3 sentences, focusing on the climate impacts:\n\n${text}`;
    const result = await model.generateContent([prompt]);
    return result.response.text();
  } catch (err: any) {
    // Check if quota exceeded error
    const isQuotaError =
      err.message?.includes("429") ||
      err.message?.includes("quota") ||
      err.message?.includes("Too Many Requests") ||
      err.status === 429;

    if (isQuotaError) {
      console.log("⚠️ Gemini API quota exceeded, using intelligent fallback summarization");
      // Don't log the full error for quota issues to reduce noise
    } else {
      console.error("❌ Gemini summarization failed:", err.message || err);
    }

    // Always use fallback for any error
    return createFallbackSummary(text);
  }
}

function createFallbackSummary(text: string): string {
  // Clean the text and extract meaningful content
  const cleanText = text.replace(/<[^>]*>/g, "").trim();

  // If text is very short, return as is
  if (cleanText.length < 50) {
    return cleanText;
  }

  // Try to extract complete sentences
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 15);

  if (sentences.length >= 2) {
    // Take first 2 complete sentences
    const summary = sentences.slice(0, 2).join(". ").trim();
    return summary + (summary.length < cleanText.length ? "..." : "");
  } else if (sentences.length === 1) {
    // Take the first sentence and add context if needed
    const firstSentence = sentences[0].trim();
    if (firstSentence.length < 100 && cleanText.length > 100) {
      return firstSentence + "...";
    }
    return firstSentence;
  }

  // Fallback: take first 150 characters at word boundary
  const truncated = cleanText.substring(0, 150);
  const lastSpace = truncated.lastIndexOf(" ");
  const summary = lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated;
  return summary + (cleanText.length > 150 ? "..." : "");
}

/* ----------------------- 新增：pledge 减排估算 ----------------------- */

export interface PledgeInputForAI {
  title: string;
  description?: string;
  category?: string; // FOOD / TRANSPORT / ENERGY / WATER / WASTE / OTHER
}

export interface PledgeAIEstimate {
  per_person_kg_per_year: number;
  confidence: number; // 0..1
  rationale: string;
}

export async function estimatePledgeReduction(input: PledgeInputForAI): Promise<PledgeAIEstimate> {
  const prompt = `
You are an environmental data analyst.
Estimate the **annual CO₂ reduction (in kilograms per person per year)** achieved by adopting this pledge.
You must answer ONLY with valid JSON (no text outside the JSON).

Required JSON format:
{
  "per_person_kg_per_year": number,   // strictly > 0 if any effect is plausible
  "confidence": number,               // 0.5–1.0 for typical household actions
  "rationale": string                 // one concise sentence (max 40 words)
}

Rules:
- Use realistic magnitudes: 
  • Food-related lifestyle changes → 200–1200 kg CO₂/year  
  • Energy-saving actions (lighting, unplugging, appliances) → 50–500 kg CO₂/year  
  • Transport choices → 300–2000 kg CO₂/year  
  • Water conservation → 50–300 kg CO₂/year  
  • Waste reduction → 100–400 kg CO₂/year  
- If the pledge is too vague, assume a **moderate effect** (≈300 kg CO₂/year).
- Do NOT output ranges or explanations outside the JSON.
- Convert weekly actions to yearly (e.g., 10 kg/week → 520 kg/year).

Now estimate for:
Title: ${input.title}
Category: ${input.category || "UNKNOWN"}
Description: ${input.description || "N/A"}
`.trim();

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      },
    } as any);

    const text = result?.response?.text()?.trim();
    console.log("🧠 Gemini raw pledge output:", text);

    let parsed: any;
    try {
      parsed = JSON.parse(text || "{}");
    } catch {
      // 如果 Gemini 乱输出，就从中提取 {…}
      const match = text?.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    let per = Number(parsed?.per_person_kg_per_year);
    let conf = Number(parsed?.confidence);
    let rat = String(parsed?.rationale || "").slice(0, 400);

    // 👇 内建的智能兜底逻辑（防止 0）
    if (!isFinite(per) || per <= 0) {
      const fallbackByCategory: Record<string, number> = {
        FOOD: 600,
        ENERGY: 300,
        TRANSPORT: 1200,
        WATER: 200,
        WASTE: 250,
        UNKNOWN: 300,
      };
      const key = (input.category || "UNKNOWN").toUpperCase();
      per = fallbackByCategory[key] || 300;
      conf = 0.75;
      rat = `Fallback estimate based on category ${key}`;
    }

    if (!isFinite(conf) || conf <= 0) conf = 0.7;

    return {
      per_person_kg_per_year: Math.round(per),
      confidence: Math.min(1, Math.max(0.5, conf)),
      rationale: rat,
    };
  } catch (err: any) {
    console.error("❌ Gemini pledge estimate failed:", err?.message || err);
    // Final safe fallback
    const key = (input.category || "UNKNOWN").toUpperCase();
    const defaults: Record<string, number> = {
      FOOD: 150,
      ENERGY: 250,
      TRANSPORT: 1200,
      WATER: 50,
      WASTE: 100,
      Shopping: 200,
      UNKNOWN: 300,
    };
    return {
      per_person_kg_per_year: defaults[key] || 300,
      confidence: 0.7,
      rationale: `Fallback due to API error for category ${key}`,
    };
  }
}
