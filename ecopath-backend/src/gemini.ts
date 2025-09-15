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
  } catch (err) {
    console.error("❌ Gemini summarization failed:", err);
    return text.slice(0, 200) + "...";
  }
}
