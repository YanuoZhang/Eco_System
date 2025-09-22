import { QuizData, AIRecommendedPledge, AIRecommendationResponse, Pledge } from "../types";
import { PledgesService } from "./pledgesService";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;
try {
  if (!apiKey) {
    // warn removed (keep silent)
  } else {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    model = genAI.getGenerativeModel({ model: modelName });
    // init info removed
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
      const text = (result.response.text() || "").trim();
      console.log("[AI] raw response:", text.slice(0, 400));
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
          const text2 = (result2.response.text() || "").trim();
          console.log("[AI] raw response (retry):", text2.slice(0, 400));
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
    // Free-form generation: allow Gemini to propose novel pledges not limited to our list
    return [
      `You are a climate assistant recommending concrete behaviour-change pledges based on a user's footprint quiz.`,
      `User quiz insights: ${insights.join(", ")}.`,
      `Output ONLY a valid JSON object with this exact top-level key: recommendations.`,
      `Each recommendation MUST be an object with fields:`,
      `id (string, unique, kebab-case), title (string), description (string), category (energy|transport|waste|water|food|lifestyle), impact (small|medium|large), aiReason (string explaining why this fits).`,
      `Return at most 5 items sorted by relevance. No markdown, no code fences, no extra commentary.`,
    ].join("\n");
  }

  private static parse(text: string, pledges: Pledge[]): AIRecommendedPledge[] {
    // First attempt: strict JSON parse (with code-fence stripping)
    try {
      let jsonLike = text;
      const fence = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
      if (fence && fence[1]) jsonLike = fence[1].trim();
      const obj = JSON.parse(jsonLike);
      const arr = Array.isArray(obj?.recommendations) ? obj.recommendations : [];
      const normalized: AIRecommendedPledge[] = [];
      for (const r of arr) {
        if (!r || typeof r !== "object") continue;
        const id = typeof r.id === "string" ? r.id : undefined;
        const title = typeof r.title === "string" ? r.title : undefined;
        const category = typeof r.category === "string" ? r.category : undefined;
        const description = typeof r.description === "string" ? r.description : "";
        const impact = typeof r.impact === "string" ? r.impact : undefined;
        const aiReason = typeof r.aiReason === "string" ? r.aiReason : undefined;
        if (!id || !title || !category) continue;
        normalized.push({
          id,
          title,
          description,
          category,
          priority: "high",
          impactScore: impact === "large" ? 3 : impact === "medium" ? 2 : 1,
          aiReason,
          impact: impact as any,
        });
        if (normalized.length >= 5) break;
      }
      if (normalized.length > 0) return normalized;
    } catch {}

    // Fallback 1: regex extract ids from free-form text
    const ids = new Set((text.match(/pledge-\d{3}/g) || []).slice(0, 5));
    const selected = pledges.filter((p) => ids.has(p.id)).slice(0, 5);
    if (selected.length) return selected.map(this.toAI);

    // Fallback 2: first N from candidates
    return pledges.slice(0, 5).map(this.toAI);
  }

  private static toAI(p: Pledge, jsonHint?: any): AIRecommendedPledge {
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      priority: "high",
      impactScore: p.impact === "high" ? 3 : p.impact === "medium" ? 2 : 1,
      aiReason: typeof jsonHint?.aiReason === "string" ? jsonHint.aiReason : undefined,
      impact:
        typeof jsonHint?.impact === "string" && ["small", "medium", "large"].includes(jsonHint.impact)
          ? (jsonHint.impact as any)
          : undefined,
    };
  }
}
