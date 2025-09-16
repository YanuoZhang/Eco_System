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
