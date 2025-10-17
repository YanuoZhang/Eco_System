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
    model = genAI.getGenerativeModel({ model: modelName });
  }
} catch (e: any) {
  console.error("[AI] Failed to initialize Gemini:", e?.message || e);
  model = null;
}

export class AIRecommendationService {
  private static cache = new Map<string, { data: AIRecommendedPledge[]; expireAt: number }>();

  // Clear all cached recommendations (call when quiz data is updated)
  public static clearCache(): void {
    this.cache.clear();
  }

  static async generateRecommendations(
    quizData: QuizData,
    forceRefresh = false,
  ): Promise<AIRecommendationResponse> {
    if (!quizData) {
      return { success: false, error: "Quiz data is required", data: [], totalRecommendations: 0 };
    }
    const insights = this.analyze(quizData);

    // Cache key by quiz hash (stable stringify)
    const key = this.hashQuiz(quizData);
    const now = Date.now();
    const hit = this.cache.get(key);

    // Skip cache if forceRefresh is true
    if (!forceRefresh && hit && hit.expireAt > now && hit.data.length > 0) {
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

      // Use timeout for the main request (60 seconds for gemini-2.5-pro with thinking)
      const requestTimeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("AI request timeout after 60s")), 60000);
      });

      const aiRequest = this.makeAIRequest(quizData, insights);
      const parsed = await Promise.race([aiRequest, requestTimeout]);

      // Only cache successful AI responses
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

    // Check for safety issues or blocked content

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

    // Analyze based on actual emissions from totals (more accurate)
    if (breakdown.electricity > 0) {
      list.push(`High electricity usage (${Math.round(breakdown.electricity)} kg CO2/year)`);
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
    if (list.length > 0) {
      const result = list.slice(0, 3);
      return result;
    }

    // Fallback: generate basic insights based on any data present
    const hasElectricity = quizData.electricity?.usage && quizData.electricity.usage > 0;
    const hasTransport = quizData.transport && Object.keys(quizData.transport).length > 0;
    const hasAppliances = quizData.appliances && Object.keys(quizData.appliances).length > 0;

    if (hasElectricity || hasTransport || hasAppliances) {
      return ["General carbon footprint detected - personalized recommendations available"];
    }

    return ["Complete more quiz sections to improve personalization"];
  }

  private static buildPrompt(quizData: QuizData, _insights: string[]): string {
    const actualQuizData = (quizData as any).quizData || quizData;
    const state = actualQuizData.state || "VIC";

    // Build detailed context from ACTUAL quiz data
    const context: string[] = [];

    // Electricity usage
    if (actualQuizData.electricity) {
      const elec = actualQuizData.electricity;
      if (elec.usage && elec.usage > 0) {
        context.push(`Electricity: User entered ${elec.usage} kWh/month (exact usage)`);
      } else if (elec.bill && elec.household) {
        context.push(
          `Electricity: Estimated from $${elec.bill}/month bill for ${elec.household}-person household`,
        );
      }
    }

    // Hot water system
    if (actualQuizData.hotWater) {
      const hw = actualQuizData.hotWater;
      if (hw.system) {
        if (hw.usage && hw.usage > 0) {
          context.push(`Hot water: ${hw.system} system, ${hw.usage} kWh/month (exact usage)`);
        } else if (hw.household) {
          context.push(`Hot water: ${hw.system} system for ${hw.household}-person household`);
        }
      }
    }

    // Appliances (ONLY those with actual usage > 0)
    if (actualQuizData.appliances?.weeklyUsage) {
      const usedAppliances = actualQuizData.appliances.weeklyUsage.filter(
        (a: any) => a.hoursPerWeek > 0,
      );
      if (usedAppliances.length > 0) {
        const appList = usedAppliances
          .map(
            (a: any) =>
              `${a.appliance} (${a.hoursPerWeek}h/week${a.energyEfficient ? ", efficient" : ", not efficient"})`,
          )
          .join(", ");
        context.push(`Appliances in use: ${appList}`);
      }
    }

    // Transport (ONLY those with actual usage > 0)
    if (actualQuizData.transport?.modes) {
      const usedTransport = actualQuizData.transport.modes.filter((m: any) => m.distance > 0);
      if (usedTransport.length > 0) {
        const transportList = usedTransport
          .map((m: any) => `${m.mode} (${m.distance} km/${m.frequency})`)
          .join(", ");
        context.push(`Transport: ${transportList}`);
      }
    }

    return [
      `You are a climate advisor for ${state}, Australia.`,
      ``,
      `USER'S ACTUAL QUIZ DATA (ONLY recommend based on what they entered):`,
      ...context.map((c) => `- ${c}`),
      ``,
      `TASK: Generate EXACTLY 5 actionable pledges based ONLY on the data above.`,
      `- Focus on the HIGHEST impact areas from their actual usage`,
      `- DO NOT suggest actions for categories they didn't fill out`,
      `- If they use gas hot water, suggest switching to heat pump`,
      `- If they use non-efficient appliances, suggest efficient replacements`,
      `- If they drive, suggest reducing or switching to public transport`,
      `- Prioritize: 1) largest emissions, 2) easiest to implement, 3) cost-effective`,
      ``,
      `FORMAT REQUIREMENTS:`,
      `- id: kebab-case slug (e.g. "switch-to-heat-pump")`,
      `- title: Clear action (max 6 words)`,
      `- description: ONE sentence explaining how (max 15 words)`,
      `- category: energy|transport|waste|water|food (match their quiz data)`,
      `- impact: small|medium|large (based on their emissions)`,
      `- aiReason: ONE sentence why this matters for THEIR situation (max 20 words)`,
      ``,
      `Output ONLY valid JSON (no markdown, no explanation):`,
      `{"recommendations": [{"id": "action-slug", "title": "Action Title", "description": "One sentence how-to", "category": "energy", "impact": "large", "aiReason": "One sentence why"}]}`,
    ].join("\n");
  }

  private static parse(text: string): AIRecommendedPledge[] {
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

      // No valid pledges parsed
      console.error("[AI] Parse failed: No valid pledges found in AI response");
      return [];
    } catch (err) {
      console.error("[AI] Parse Debug - JSON parse failed:", err);
      return [];
    }
  }
}
