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
    console.log("[AI] Debug - Insights generated:", insights);

    // Cache key by quiz hash (stable stringify)
    const key = this.hashQuiz(quizData);
    const now = Date.now();
    const hit = this.cache.get(key);

    if (hit && hit.expireAt > now && hit.data.length > 0) {
      return {
        success: true,
        data: hit.data,
        totalRecommendations: hit.data.length,
        quizData,
        insights,
        timestamp: new Date().toISOString(),
      };
    }

    // Clear any bad cache entries
    if (hit && hit.data.length === 0) {
      this.cache.delete(key);
    }
    try {
      // Use timeout for the main request
      const requestTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI request timeout")), 8000); // 8 second timeout
      });

      const aiRequest = this.makeAIRequest(quizData, insights);
      const parsed = await Promise.race([aiRequest, requestTimeout]);

      // Only cache successful AI responses, not fallback suggestions
      if (parsed.length > 0) {
        const expireAt = now + 24 * 60 * 60 * 1000;
        this.cache.set(key, { data: parsed, expireAt });
      }
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

      // Only retry once for rate limiting, not for timeouts
      const message = String(err?.message || "");
      if (message.includes("429") && model && !message.includes("timeout")) {
        const retryMatch = message.match(/Retry\s?in\s([0-9.]+)s/);
        if (retryMatch) {
          const delaySec = Math.min(5, Math.max(1, Number(retryMatch[1]) || 3)); // Reduced retry delay
          await new Promise((r) => setTimeout(r, delaySec * 1000));
          try {
            const parsed2 = await this.makeAIRequest(quizData, insights);
            const expireAt = now + 24 * 60 * 60 * 1000;
            this.cache.set(key, { data: parsed2, expireAt });
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
      }

      // Fallback: generate simple pledges based on quiz insights
      const fallbackPledges: AIRecommendedPledge[] = [];

      // Generate specific, actionable pledges based on insights
      if (insights.includes("Electricity usage detected")) {
        fallbackPledges.push({
          id: "unplug-electronics-nightly",
          title: "Unplug Electronics at Night",
          description:
            "Unplug all chargers, TVs, and electronics before bed. Use a power strip for easy switching.",
          category: "energy",
          priority: "high",
          impactScore: 2,
          aiReason:
            "Phantom energy from plugged-in devices adds up - unplugging saves money and reduces emissions",
          impact: "medium",
        });
        fallbackPledges.push({
          id: "switch-to-led-bulbs",
          title: "Switch to LED Bulbs",
          description:
            "Replace all incandescent bulbs with LED bulbs. Start with the most-used rooms first.",
          category: "energy",
          priority: "high",
          impactScore: 3,
          aiReason: "LED bulbs use 75% less energy than traditional bulbs and last much longer",
          impact: "large",
        });
      }

      if (insights.includes("Hot water usage detected")) {
        fallbackPledges.push({
          id: "take-5-minute-showers",
          title: "Take 5-Minute Showers",
          description:
            "Set a timer for 5 minutes and stick to it. Every minute saved reduces energy and water usage.",
          category: "water",
          priority: "high",
          impactScore: 2,
          aiReason:
            "Shorter showers significantly reduce hot water heating costs and water consumption",
          impact: "medium",
        });
      }

      if (insights.includes("Car usage detected")) {
        fallbackPledges.push({
          id: "walk-or-bike-short-trips",
          title: "Walk or Bike for Short Trips",
          description:
            "For trips under 2km, choose walking or cycling instead of driving. Set a weekly goal.",
          category: "transport",
          priority: "high",
          impactScore: 3,
          aiReason:
            "Short car trips are inefficient and contribute significantly to your transport emissions",
          impact: "large",
        });
      }

      // Cache fallback pledges too (but with shorter expiry)
      if (fallbackPledges.length > 0) {
        const shortExpireAt = now + 2 * 60 * 60 * 1000; // 2 hours for fallback
        this.cache.set(key, { data: fallbackPledges.slice(0, 5), expireAt: shortExpireAt });
      }

      return {
        success: true,
        data: fallbackPledges.slice(0, 5),
        totalRecommendations: fallbackPledges.length,
        quizData,
        insights,
      };
    }
  }

  private static async makeAIRequest(
    quizData: QuizData,
    insights: string[],
  ): Promise<AIRecommendedPledge[]> {
    const all = await PledgesService.getPublicPledges(1, 50); // Reduced from 100 to 50
    const prompt = this.buildPrompt(quizData, insights, all.data || []);
    if (!model) throw new Error("Gemini model not initialized");
    const result = await model.generateContent([prompt]);
    const text = (result.response.text() || "").trim();
    return this.parse(text, all.data || []);
  }

  private static hashQuiz(obj: unknown): string {
    try {
      // Extract only stable quiz data, excluding timestamps and dynamic fields
      const quizData = (obj as any).quizData || obj;
      const stableData = {
        location: quizData.location,
        electricity: quizData.electricity,
        hotWater: quizData.hotWater,
        appliances: quizData.appliances,
        transport: quizData.transport,
        state: quizData.state,
        timeUnit: quizData.timeUnit,
        totals: quizData.totals,
        // Exclude savedAt, timestamp, and other dynamic fields
      };
      const stable = JSON.stringify(stableData, Object.keys(stableData).sort());
      let h = 0;
      for (let i = 0; i < stable.length; i++) h = (h * 31 + stable.charCodeAt(i)) >>> 0;
      return h.toString(16);
    } catch {
      return String(Date.now());
    }
  }

  private static analyze(quizData: QuizData): string[] {
    const list: string[] = [];
    console.log("[AI] Debug - Analyzing quizData:", JSON.stringify(quizData, null, 2));

    // Handle nested quizData structure
    const actualQuizData = (quizData as any).quizData || quizData;

    // More flexible electricity analysis
    console.log("[AI] Debug - Electricity usage:", actualQuizData.electricity?.usage);
    if (actualQuizData.electricity?.usage && (actualQuizData.electricity.usage || 0) > 100) {
      list.push("Electricity usage detected");
      console.log("[AI] Debug - Added electricity insight");
    }

    // Check for hot water usage (any type)
    if (actualQuizData.hotWater?.usage && (actualQuizData.hotWater.usage || 0) > 0)
      list.push("Hot water usage detected");

    // Check for car usage in different formats
    const carDistance =
      (actualQuizData.transport as any)?.car?.distance ||
      (actualQuizData.transport?.modes || []).find((m: any) => m.mode === "car")?.distance ||
      0;
    if (carDistance > 20) list.push("Car usage detected");

    // Check for appliances
    if ((actualQuizData.appliances?.weeklyUsage || []).length > 0) list.push("Appliances in use");

    // If we have any meaningful data, generate insights
    if (list.length > 0) return list;

    // Fallback: generate basic insights based on any data present
    const hasElectricity = quizData.electricity?.usage && quizData.electricity.usage > 0;
    const hasTransport = quizData.transport && Object.keys(quizData.transport).length > 0;
    const hasAppliances = quizData.appliances && Object.keys(quizData.appliances).length > 0;

    if (hasElectricity || hasTransport || hasAppliances) {
      return ["General carbon footprint detected - personalized recommendations available"];
    }

    return ["Complete more quiz sections to improve personalization"];
  }

  private static buildPrompt(quizData: QuizData, insights: string[], _pledges: Pledge[]): string {
    return [
      `Create specific, actionable climate pledges based on: ${insights.join(", ")}.`,
      `Generate concrete actions that users can implement immediately and set reminders for.`,
      `Examples of good pledges: "Switch to LED bulbs", "Take 5-minute showers", "Use reusable bags", "Bike to work twice a week"`,
      `Avoid generic advice like "complete quiz" or "learn more". Focus on specific, measurable actions.`,
      ``,
      `JSON format: {"recommendations": [{"id": "unique-id", "title": "Specific Action", "description": "Clear steps to take", "category": "energy|transport|waste|water|food|lifestyle", "impact": "small|medium|large", "aiReason": "Why this helps"}]}`,
      `Max 3 items. No markdown.`,
    ].join("\n");
  }

  private static parse(text: string, pledges: Pledge[]): AIRecommendedPledge[] {
    console.log("[AI] Parse Debug - Input text:", text.slice(0, 500));

    // First attempt: strict JSON parse (with code-fence stripping)
    try {
      let jsonLike = text;
      const fence = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
      if (fence && fence[1]) jsonLike = fence[1].trim();
      const obj = JSON.parse(jsonLike);
      console.log("[AI] Parse Debug - Parsed object:", obj);

      const arr = Array.isArray(obj?.recommendations) ? obj.recommendations : [];
      console.log("[AI] Parse Debug - Extracted array:", arr);

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
      console.log("[AI] Parse Debug - Normalized pledges:", normalized);
      if (normalized.length > 0) return normalized;
    } catch (err) {
      console.log("[AI] Parse Debug - JSON parse failed:", err);
    }

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
        typeof jsonHint?.impact === "string" &&
        ["small", "medium", "large"].includes(jsonHint.impact)
          ? (jsonHint.impact as any)
          : undefined,
    };
  }
}
