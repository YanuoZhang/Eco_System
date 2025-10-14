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

      // Fallback: generate pledges based on actual emissions data
      const fallbackPledges: AIRecommendedPledge[] = [];
      const actualQuizData = (quizData as any).quizData || quizData;
      const totals = actualQuizData.totals || {};

      // Sort categories by emissions (highest first)
      const categories = [
        { name: "appliances", kg: totals.appliancesKgYear || 0 },
        { name: "hotWater", kg: totals.hotWaterKgYear || 0 },
        { name: "transport", kg: totals.transportKgYear || 0 },
        { name: "electricity", kg: totals.electricityKgYear || 0 },
      ]
        .filter((c) => c.kg > 0)
        .sort((a, b) => b.kg - a.kg);

      console.log("[AI] Fallback - Categories by emissions:", categories);

      // Generate pledges for top emission categories
      for (const cat of categories.slice(0, 2)) {
        // Focus on top 2 categories
        if (cat.name === "appliances" && fallbackPledges.length < 3) {
          fallbackPledges.push({
            id: "switch-to-energy-efficient-appliances",
            title: "Use Energy-Efficient Appliances",
            description:
              "Replace old appliances with Energy Star rated models. Start with the fridge and AC.",
            category: "energy",
            priority: "high",
            impactScore: 3,
            aiReason: `Your appliances produce ${Math.round(cat.kg)} kg CO2/year - upgrading can reduce this by 25-50%`,
            impact: "large",
          });
        }

        if (cat.name === "hotWater" && fallbackPledges.length < 3) {
          fallbackPledges.push({
            id: "take-5-minute-showers",
            title: "Take 5-Minute Showers",
            description:
              "Set a timer for 5 minutes and stick to it. Every minute saved reduces energy and water usage.",
            category: "water",
            priority: "high",
            impactScore: 2,
            aiReason: `Hot water heating produces ${Math.round(cat.kg)} kg CO2/year - shorter showers can save up to 30%`,
            impact: "medium",
          });
        }

        if (cat.name === "transport" && fallbackPledges.length < 3) {
          // Check actual transport modes
          const modes = actualQuizData.transport?.modes || [];
          const hasCar = modes.some((m: any) => m.mode === "car" && m.distance > 0);

          if (hasCar) {
            fallbackPledges.push({
              id: "walk-or-bike-short-trips",
              title: "Walk or Bike for Short Trips",
              description:
                "For trips under 2km, choose walking or cycling instead of driving. Set a weekly goal.",
              category: "transport",
              priority: "high",
              impactScore: 3,
              aiReason: `Transport produces ${Math.round(cat.kg)} kg CO2/year - replacing short car trips can save 20%`,
              impact: "large",
            });
          } else {
            fallbackPledges.push({
              id: "optimize-public-transport-routes",
              title: "Optimize Your Commute Route",
              description:
                "Review your regular routes and consider combining trips or choosing more efficient options.",
              category: "transport",
              priority: "medium",
              impactScore: 2,
              aiReason: `Transport produces ${Math.round(cat.kg)} kg CO2/year - optimizing routes can reduce emissions`,
              impact: "medium",
            });
          }
        }

        if (cat.name === "electricity" && fallbackPledges.length < 3) {
          fallbackPledges.push({
            id: "switch-to-led-bulbs",
            title: "Switch to LED Bulbs",
            description:
              "Replace all incandescent bulbs with LED bulbs. Start with the most-used rooms first.",
            category: "energy",
            priority: "high",
            impactScore: 3,
            aiReason: `Electricity produces ${Math.round(cat.kg)} kg CO2/year - LED bulbs use 75% less energy`,
            impact: "large",
          });
        }
      }

      // Add general pledges if we don't have enough yet
      if (fallbackPledges.length < 3 && totals.totalKgYear > 0) {
        if (!fallbackPledges.some((p) => p.category === "waste")) {
          fallbackPledges.push({
            id: "use-reusable-bags",
            title: "Use Reusable Shopping Bags",
            description:
              "Keep reusable bags in your car or by the door. Say no to plastic bags at checkout.",
            category: "waste",
            priority: "medium",
            impactScore: 2,
            aiReason:
              "Reducing single-use plastics helps decrease waste and manufacturing emissions",
            impact: "medium",
          });
        }
        if (fallbackPledges.length < 3 && !fallbackPledges.some((p) => p.category === "food")) {
          fallbackPledges.push({
            id: "reduce-food-waste",
            title: "Plan Meals to Reduce Food Waste",
            description:
              "Create a weekly meal plan and shopping list. Store leftovers properly and use them creatively.",
            category: "food",
            priority: "medium",
            impactScore: 2,
            aiReason:
              "Food waste contributes to methane emissions - reducing it has significant climate impact",
            impact: "medium",
          });
        }
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

  private static buildPrompt(quizData: QuizData, insights: string[], _pledges: Pledge[]): string {
    const actualQuizData = (quizData as any).quizData || quizData;
    const state = actualQuizData.state || "VIC";

    return [
      `You are an expert climate advisor helping an Australian in ${state} reduce their carbon footprint.`,
      ``,
      `User's Current Emissions:`,
      insights.map((i) => `- ${i}`).join("\n"),
      ``,
      `Generate 3-5 specific, actionable climate pledges that will have the MOST IMPACT on their emissions.`,
      `Focus on the categories with highest emissions first.`,
      ``,
      `Requirements:`,
      `1. Each pledge must be specific and measurable (e.g., "Switch all bulbs to LED" not "save energy")`,
      `2. Include clear, actionable steps in the description`,
      `3. Explain the carbon reduction benefit in aiReason`,
      `4. Category must be: energy, transport, waste, water, food, or lifestyle`,
      `5. Impact rating: small (<100kg/year), medium (100-500kg/year), large (>500kg/year)`,
      ``,
      `Examples of good pledges:`,
      `- "Switch to LED bulbs" (energy, large impact for high electricity users)`,
      `- "Take 5-minute showers" (water/energy, medium impact for high hot water usage)`,
      `- "Use reusable coffee cup daily" (waste, small impact but easy habit)`,
      `- "Bike to work twice a week" (transport, large impact for car commuters)`,
      ``,
      `Output JSON only (no markdown):`,
      `{"recommendations": [{"id": "action-slug", "title": "Clear Action Title", "description": "Specific steps to take", "category": "energy", "impact": "large", "aiReason": "Why this matters for this user"}]}`,
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
