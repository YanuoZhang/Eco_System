import { QuizData, AIRecommendedPledge, AIRecommendationResponse } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;
try {
  if (!apiKey) {
    // warn removed (keep silent)
  } else {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7, // Lower = more focused
        maxOutputTokens: 600, // Limit response length for faster replies
        topP: 0.8,
        topK: 40,
      },
    });
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
      console.log(
        `[AI] ✅ Cache HIT for quiz ${key} - returning ${hit.data.length} cached recommendations`,
      );
      return {
        success: true,
        data: hit.data,
        totalRecommendations: hit.data.length,
        quizData,
        insights,
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`[AI] ❌ Cache MISS for quiz ${key} - fetching new AI recommendations`);

    // Clear any bad cache entries
    if (hit && hit.data.length === 0) {
      this.cache.delete(key);
    }
    try {
      // Check if model is initialized
      if (!model) {
        console.error("[AI] Gemini model not initialized - check GEMINI_API_KEY");
        return {
          success: false,
          error: "AI model not initialized. Please check GEMINI_API_KEY environment variable.",
          data: [],
          totalRecommendations: 0,
        };
      }

      console.log("[AI] Making AI request with insights:", insights);

      // Use timeout for the main request (20 seconds for faster responses)
      const requestTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI request timeout after 20s")), 20000);
      });

      const aiRequest = this.makeAIRequest(quizData, insights);
      const parsed = await Promise.race([aiRequest, requestTimeout]);

      console.log("[AI] AI request successful, got", parsed.length, "recommendations");

      // Only cache successful AI responses
      if (parsed.length > 0) {
        const expireAt = now + 24 * 60 * 60 * 1000;
        this.cache.set(key, { data: parsed, expireAt });
        console.log(
          `[AI] 💾 Cached ${parsed.length} recommendations for quiz ${key} (expires in 24h)`,
        );
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
      console.error("[AI] Full error:", err);

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
          } catch (retryErr) {
            console.error("[AI] Retry also failed:", retryErr);
          }
        }
      }

      // Return error - no fallback
      return {
        success: false,
        error: `AI recommendation failed: ${message}. Please ensure GEMINI_API_KEY is set correctly.`,
        data: [],
        totalRecommendations: 0,
      };
    }
  }

  private static async makeAIRequest(
    quizData: QuizData,
    insights: string[],
  ): Promise<AIRecommendedPledge[]> {
    // Only use top 3 most important insights
    const topInsights = insights.slice(0, 3);
    const prompt = this.buildPrompt(quizData, topInsights);
    if (!model) throw new Error("Gemini model not initialized");

    // Generate with optimized settings for faster, more concise responses
    const result = await model.generateContent(prompt);

    const text = (result.response.text() || "").trim();
    return this.parse(text);
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
    const totals = actualQuizData.totals || {};
    const breakdown = {
      electricity: totals.electricityKgYear || 0,
      hotWater: totals.hotWaterKgYear || 0,
      appliances: totals.appliancesKgYear || 0,
      transport: totals.transportKgYear || 0,
      total: totals.totalKgYear || 0,
    };

    console.log("[AI] Debug - Emissions breakdown:", breakdown);

    // Analyze based on actual emissions from totals (more accurate)
    if (breakdown.electricity > 0) {
      list.push(`High electricity usage (${Math.round(breakdown.electricity)} kg CO2/year)`);
      console.log("[AI] Debug - Added electricity insight from totals");
    }

    if (breakdown.hotWater > 0) {
      const system = actualQuizData.hotWater?.system || "unknown";
      list.push(
        `Hot water emissions (${Math.round(breakdown.hotWater)} kg CO2/year, ${system} system)`,
      );
    }

    if (breakdown.appliances > 0) {
      // Get appliance details for more specific insights
      const appBreakdown = actualQuizData.applianceBreakdown || {};
      const topAppliances = Object.entries(appBreakdown)
        .map(([_key, data]: [string, any]) => ({
          name: data.name,
          emissions: data.emissions || 0,
        }))
        .filter((a) => a.emissions > 0)
        .sort((a, b) => b.emissions - a.emissions)
        .slice(0, 3);

      if (topAppliances.length > 0) {
        const names = topAppliances.map((a) => a.name).join(", ");
        list.push(
          `High appliance usage (${Math.round(breakdown.appliances)} kg CO2/year from ${names})`,
        );
      } else {
        list.push(`Appliances contribute ${Math.round(breakdown.appliances)} kg CO2/year`);
      }
    }

    if (breakdown.transport > 0) {
      // Analyze transport modes
      const modes = actualQuizData.transport?.modes || [];
      const transportBreakdown = actualQuizData.transportBreakdown || {};
      const modeDetails = modes
        .filter((m: any) => m.distance > 0)
        .map((m: any) => {
          const emissions = transportBreakdown[m.mode]?.emissions || 0;
          return { mode: m.mode, distance: m.distance, emissions };
        })
        .sort((a: any, b: any) => b.emissions - a.emissions);

      if (modeDetails.length > 0) {
        const modeList = modeDetails.map((m: any) => m.mode).join(", ");
        list.push(
          `Transport emissions: ${Math.round(breakdown.transport)} kg CO2/year (using ${modeList})`,
        );
      } else {
        list.push(`Transport contributes ${Math.round(breakdown.transport)} kg CO2/year`);
      }
    }

    // Add total footprint context
    if (breakdown.total > 0) {
      const avgAustralian = 15000; // Average Australian carbon footprint
      const percentOfAvg = Math.round((breakdown.total / avgAustralian) * 100);
      list.push(
        `Total footprint: ${Math.round(breakdown.total)} kg CO2/year (${percentOfAvg}% of average Australian)`,
      );
    }

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

  private static buildPrompt(quizData: QuizData, insights: string[]): string {
    const actualQuizData = (quizData as any).quizData || quizData;
    const state = actualQuizData.state || "VIC";

    return [
      `Climate advisor for ${state} Australian. User emissions: ${insights.join("; ")}`,
      ``,
      `Generate exactly 3 pledges. Focus on highest impact first.`,
      ``,
      `Requirements:`,
      `- Specific actions (e.g. "Switch to LED bulbs")`,
      `- Description: ONE sentence, max 15 words`,
      `- aiReason: ONE sentence, max 20 words`,
      `- Category: energy|transport|waste|water|food`,
      `- Impact: small|medium|large`,
      ``,
      `Output JSON only (no markdown, no explanation):`,
      `{"recommendations": [{"id": "action-slug", "title": "Action Title", "description": "One sentence how-to", "category": "energy", "impact": "large", "aiReason": "One sentence why"}]}`,
    ].join("\n");
  }

  private static parse(text: string): AIRecommendedPledge[] {
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
        if (normalized.length >= 3) break;
      }
      console.log("[AI] Parse Debug - Normalized pledges:", normalized);
      if (normalized.length > 0) return normalized;

      // No valid pledges parsed
      console.error("[AI] Parse failed: No valid pledges found in AI response");
      return [];
    } catch (err) {
      console.error("[AI] Parse Debug - JSON parse failed:", err);
      return [];
    }
  }
}
