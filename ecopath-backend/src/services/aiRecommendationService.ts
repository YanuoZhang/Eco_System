import { QuizData, AIRecommendedPledge, AIRecommendationResponse, Pledge } from "../types";
import { PledgesService } from "./pledgesService";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;
try {
  if (!apiKey) {
    console.warn("[AI] GEMINI_API_KEY is missing or empty; using fallback recommendations.");
  } else {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    model = genAI.getGenerativeModel({ model: modelName });
    console.log(`[AI] Gemini initialized with model: ${modelName}`);
  }
} catch (e: any) {
  console.error("[AI] Failed to initialize Gemini:", e?.message || e);
  model = null;
}

export class AIRecommendationService {
  private static cache = new Map<string, { data: AIRecommendedPledge[]; expireAt: number }>();

  static async generateRecommendations(quizData: QuizData): Promise<AIRecommendationResponse> {
    if (!quizData) {
      return { success: false, error: "Quiz data is required", data: [], totalRecommendations: 0 };
    }
    const insights = this.analyze(quizData);

    // Cache key by quiz hash (stable stringify)
    const key = this.hashQuiz(quizData);
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && hit.expireAt > now) {
      return {
        success: true,
        data: hit.data,
        totalRecommendations: hit.data.length,
        quizData,
        insights,
        timestamp: new Date().toISOString(),
      };
    }
    try {
      const all = await PledgesService.getPublicPledges(1, 100);
      const prompt = this.buildPrompt(quizData, insights, all.data || []);
      if (!model) throw new Error("Gemini model not initialized");
      const result = await model.generateContent([prompt]);
      const text = result.response.text();
      const parsed = this.parse(text, all.data || []);
      // Save cache for 24h
      this.cache.set(key, { data: parsed, expireAt: now + 24 * 60 * 60 * 1000 });
      return {
        success: true,
        data: parsed,
        totalRecommendations: parsed.length,
        quizData,
        insights,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("[AI] generateRecommendations failed:", err?.message || err);

      // Retry once if 429 with retry info
      const message = String(err?.message || "");
      const retryMatch = message.match(/Retry\s?in\s([0-9.]+)s/);
      if (retryMatch && model) {
        const delaySec = Math.min(20, Math.max(1, Number(retryMatch[1]) || 5));
        await new Promise((r) => setTimeout(r, delaySec * 1000));
        try {
          const all = await PledgesService.getPublicPledges(1, 100);
          const prompt = this.buildPrompt(quizData, insights, all.data || []);
          const result2 = await model.generateContent([prompt]);
          const text2 = result2.response.text();
          const parsed2 = this.parse(text2, all.data || []);
          this.cache.set(key, { data: parsed2, expireAt: now + 24 * 60 * 60 * 1000 });
          return {
            success: true,
            data: parsed2,
            totalRecommendations: parsed2.length,
            quizData,
            insights,
            timestamp: new Date().toISOString(),
          };
        } catch {}
      }

      // Fallback: pick top pledges by category hints
      const fallback = (await PledgesService.getPublicPledges(1, 20)).data || [];
      return {
        success: true,
        data: fallback.slice(0, 5).map(this.toAI),
        totalRecommendations: 5,
        quizData,
        insights,
      };
    }
  }

  private static hashQuiz(obj: unknown): string {
    try {
      const stable = JSON.stringify(obj, Object.keys(obj as any).sort());
      let h = 0;
      for (let i = 0; i < stable.length; i++) h = (h * 31 + stable.charCodeAt(i)) >>> 0;
      return h.toString(16);
    } catch {
      return String(Date.now());
    }
  }

  private static analyze(quizData: QuizData): string[] {
    const list: string[] = [];
    if (quizData.electricity?.usage && (quizData.electricity.usage || 0) > 500)
      list.push("High electricity usage");
    if (quizData.hotWater?.system === "electric") list.push("Electric hot water");
    if ((quizData.transport?.modes || []).some((m) => m.mode === "car" && (m.distance || 0) > 50))
      list.push("Heavy car usage");
    if ((quizData.appliances?.weeklyUsage || []).length > 5) list.push("Many appliances in use");
    return list.length ? list : ["Complete more quiz sections to improve personalization"];
  }

  private static buildPrompt(quizData: QuizData, insights: string[], pledges: Pledge[]): string {
    return `User quiz insights: ${insights.join(", ")}. Available pledges: ${pledges
      .map((p) => `${p.id}:${p.title}(${p.category}/${p.impact})`)
      .join(
        "; ",
      )}. Recommend 5 pledges (ids only) best matching insights with priority and reasoning.`;
  }

  private static parse(text: string, pledges: Pledge[]): AIRecommendedPledge[] {
    const ids = new Set((text.match(/pledge-\d{3}/g) || []).slice(0, 5));
    const selected = pledges.filter((p) => ids.has(p.id)).slice(0, 5);
    if (!selected.length) return pledges.slice(0, 5).map(this.toAI);
    return selected.map(this.toAI);
  }

  private static toAI(p: Pledge): AIRecommendedPledge {
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      priority: "high",
      impactScore: p.impact === "high" ? 3 : p.impact === "medium" ? 2 : 1,
    };
  }
}
