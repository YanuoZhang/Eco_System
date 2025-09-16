import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.development") });

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function summarizeText(text: string): Promise<string> {
  try {
    const prompt = `Summarize this news in 2-3 sentences, focusing on the climate impacts:\n\n${text}`;
    const result = await model.generateContent([prompt]);
    return result.response.text();
  } catch (err: any) {
    console.error("❌ Gemini summarization failed:", err);

    // Check if quota exceeded error
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      console.log("⚠️ Gemini API quota exceeded, using fallback summarization");
      return createFallbackSummary(text);
    }

    // Use fallback for other errors too
    return createFallbackSummary(text);
  }
}

function createFallbackSummary(text: string): string {
  // Simple fallback strategy: take first 200 characters and add ellipsis
  const cleanText = text.replace(/<[^>]*>/g, "").trim();
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  if (sentences.length >= 2) {
    return sentences.slice(0, 2).join(". ").trim() + "...";
  }

  return cleanText.slice(0, 200) + "...";
}
