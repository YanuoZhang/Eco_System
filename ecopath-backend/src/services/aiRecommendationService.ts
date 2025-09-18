import { QuizData, AIRecommendedPledge, AIRecommendationResponse, Pledge } from "../types";
import { PledgesService } from "./pledgesService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.development") });

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export class AIRecommendationService {
  /**
   * Generate AI-powered pledge recommendations based on quiz data
   */
  static async generateRecommendations(quizData: QuizData): Promise<AIRecommendationResponse> {
    try {
      // Validate quiz data
      if (!this.hasValidQuizData(quizData)) {
        return {
          success: false,
          error: "Insufficient quiz data. Please complete the carbon footprint quiz to get personalized recommendations.",
          data: [],
          totalRecommendations: 0,
          insights: ["Complete the quiz to unlock personalized recommendations"]
        };
      }

      // Analyze user's carbon footprint patterns
      const insights = this.analyzeCarbonFootprint(quizData);
      
      // Generate recommendations based on analysis
      const recommendations = await this.generatePersonalizedRecommendations(quizData, insights);
      
      // Sort by priority and impact
      const sortedRecommendations = recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.impactScore - a.impactScore;
      });

      return {
        success: true,
        data: sortedRecommendations,
        totalRecommendations: sortedRecommendations.length,
        quizData,
        insights,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      return {
        success: false,
        error: "Failed to generate recommendations. Please try again later.",
        data: [],
        totalRecommendations: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if quiz data is sufficient for recommendations
   */
  private static hasValidQuizData(quizData: QuizData): boolean {
    return !!(
      quizData.electricity?.usage ||
      quizData.hotWater?.system ||
      quizData.transport?.modes?.length ||
      quizData.appliances?.weeklyUsage?.length
    );
  }

  /**
   * Analyze user's carbon footprint to generate insights
   */
  private static analyzeCarbonFootprint(quizData: QuizData): string[] {
    const insights: string[] = [];

    // Electricity insights
    if (quizData.electricity) {
      const { usage, timeUnit, household, ledBulbs, airConditioning, efficientAppliances } = quizData.electricity;
      const annualUsage = this.convertToAnnualUsage(usage, timeUnit);
      const perPersonUsage = annualUsage / household;

      if (perPersonUsage > 4000) {
        insights.push("Your electricity usage is above average - consider energy-saving measures");
      } else if (perPersonUsage < 2000) {
        insights.push("Great job! Your electricity usage is below average");
      }

      if (ledBulbs === "no") {
        insights.push("Switching to LED bulbs could significantly reduce your electricity consumption");
      }

      if (airConditioning === "frequently") {
        insights.push("Frequent AC usage contributes significantly to your carbon footprint");
      }

      if (efficientAppliances === "no") {
        insights.push("Upgrading to energy-efficient appliances could save you money and reduce emissions");
      }
    }

    // Hot water insights
    if (quizData.hotWater) {
      const { system, energySaving } = quizData.hotWater;
      
      if (system === "electric" && !energySaving) {
        insights.push("Electric hot water systems are energy-intensive - consider efficiency improvements");
      } else if (system === "solar") {
        insights.push("Excellent choice! Solar hot water is one of the most sustainable options");
      }
    }

    // Transport insights
    if (quizData.transport?.modes) {
      const carUsage = quizData.transport.modes.find(m => m.mode === "car");
      const activeTransport = quizData.transport.modes.filter(m => 
        m.mode === "bicycle" || m.mode === "walking"
      );

      if (carUsage && carUsage.distance > 100) {
        insights.push("High car usage detected - consider alternative transport options");
      }

      if (activeTransport.length > 0) {
        insights.push("Great! You're already using sustainable transport options");
      }
    }

    // Appliances insights
    if (quizData.appliances?.weeklyUsage) {
      const inefficientAppliances = quizData.appliances.weeklyUsage.filter(a => !a.energyEfficient);
      if (inefficientAppliances.length > 0) {
        insights.push("Some of your appliances could be more energy-efficient");
      }
    }

    return insights.length > 0 ? insights : ["Complete more sections of the quiz for detailed insights"];
  }

  /**
   * Generate personalized recommendations using Gemini AI
   */
  private static async generatePersonalizedRecommendations(
    quizData: QuizData, 
    insights: string[]
  ): Promise<AIRecommendedPledge[]> {
    try {
      // Get all available pledges
      const allPledges = await PledgesService.getPublicPledges(1, 100);
      if (!allPledges.success || !allPledges.data) {
        return [];
      }

      // Create prompt for Gemini AI
      const prompt = this.createGeminiPrompt(quizData, insights, allPledges.data);
      
      // Call Gemini AI
      const result = await model.generateContent([prompt]);
      const aiResponse = result.response.text();
      
      // Parse AI response and match with existing pledges
      return this.parseAIResponse(aiResponse, allPledges.data);
    } catch (error) {
      console.error("Gemini AI recommendation failed, using fallback:", error);
      // Fallback to rule-based recommendations
      return this.generateFallbackRecommendations(quizData, insights);
    }
  }

  /**
   * Create prompt for Gemini AI
   */
  private static createGeminiPrompt(quizData: QuizData, insights: string[], pledges: Pledge[]): string {
    const pledgesList = pledges.map(p => 
      `ID: ${p.id}, Title: ${p.title}, Category: ${p.category}, Difficulty: ${p.difficulty}, Impact: ${p.impact}`
    ).join('\n');

    return `You are an AI assistant that provides personalized eco-friendly recommendations based on user's carbon footprint data.

User's Carbon Footprint Data:
${JSON.stringify(quizData, null, 2)}

Key Insights:
${insights.join(', ')}

Available Pledges:
${pledgesList}

Please analyze the user's data and provide 5-8 personalized recommendations. For each recommendation:

1. Select the most relevant pledge ID from the available list
2. Write a personalized explanation (2-3 sentences) explaining why this recommendation is specifically relevant to this user
3. Assign a confidence score (0.0-1.0) based on how well the recommendation matches their data
4. Assign an impact score (0.0-1.0) based on potential environmental impact for this user
5. Assign priority: "high", "medium", or "low"

Format your response as JSON array:
[
  {
    "pledgeId": "pledge-001",
    "explanation": "Personalized explanation here...",
    "confidence": 0.9,
    "impactScore": 0.8,
    "priority": "high"
  }
]

Focus on:
- Energy efficiency improvements for high electricity users
- Transportation alternatives for frequent drivers
- Water conservation for high water usage
- Waste reduction strategies
- Lifestyle changes that match their current patterns

Make explanations specific to their actual usage data and household size.`;
  }

  /**
   * Parse AI response and match with existing pledges
   */
  private static parseAIResponse(aiResponse: string, pledges: Pledge[]): AIRecommendedPledge[] {
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in AI response");
      }

      const recommendations = JSON.parse(jsonMatch[0]);
      const result: AIRecommendedPledge[] = [];

      for (const rec of recommendations) {
        const pledge = pledges.find(p => p.id === rec.pledgeId);
        if (pledge) {
          result.push({
            ...pledge,
            explanation: rec.explanation,
            confidence: Math.min(Math.max(rec.confidence || 0.5, 0), 1),
            impactScore: Math.min(Math.max(rec.impactScore || 0.5, 0), 1),
            priority: rec.priority || "medium"
          });
        }
      }

      return result;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return [];
    }
  }

  /**
   * Fallback recommendations when AI fails
   */
  private static async generateFallbackRecommendations(
    quizData: QuizData, 
    insights: string[]
  ): Promise<AIRecommendedPledge[]> {
    const recommendations: AIRecommendedPledge[] = [];
    const allPledges = await PledgesService.getPublicPledges(1, 100);

    if (!allPledges.success || !allPledges.data) {
      return [];
    }

    // Energy recommendations
    if (quizData.electricity) {
      const energyRecommendations = this.getEnergyRecommendations(quizData.electricity, allPledges.data);
      recommendations.push(...energyRecommendations);
    }

    // Hot water recommendations
    if (quizData.hotWater) {
      const hotWaterRecommendations = this.getHotWaterRecommendations(quizData.hotWater, allPledges.data);
      recommendations.push(...hotWaterRecommendations);
    }

    // Transport recommendations
    if (quizData.transport) {
      const transportRecommendations = this.getTransportRecommendations(quizData.transport, allPledges.data);
      recommendations.push(...transportRecommendations);
    }

    // Appliance recommendations
    if (quizData.appliances) {
      const applianceRecommendations = this.getApplianceRecommendations(quizData.appliances, allPledges.data);
      recommendations.push(...applianceRecommendations);
    }

    // Lifestyle recommendations based on overall patterns
    const lifestyleRecommendations = this.getLifestyleRecommendations(quizData, allPledges.data);
    recommendations.push(...lifestyleRecommendations);

    return recommendations;
  }

  /**
   * Get energy-specific recommendations
   */
  private static getEnergyRecommendations(
    electricity: QuizData["electricity"], 
    allPledges: Pledge[]
  ): AIRecommendedPledge[] {
    const recommendations: AIRecommendedPledge[] = [];
    
    if (!electricity) return recommendations;

    const { usage, timeUnit, household, ledBulbs, airConditioning, efficientAppliances } = electricity;
    const annualUsage = this.convertToAnnualUsage(usage, timeUnit);
    const perPersonUsage = annualUsage / household;

    // LED bulbs recommendation
    if (ledBulbs === "no" || ledBulbs === "mixed") {
      const ledPledge = allPledges.find(p => p.id === "pledge-002");
      if (ledPledge) {
        recommendations.push({
          ...ledPledge,
          explanation: `Based on your ${Math.round(perPersonUsage)} kWh annual electricity usage per person, switching to LED bulbs could save you $100-200 per year and reduce your carbon footprint by 200kg CO2 annually.`,
          confidence: 0.9,
          impactScore: 0.8,
          priority: "high"
        });
      }
    }

    // Turn off lights recommendation
    if (perPersonUsage > 3000) {
      const lightsPledge = allPledges.find(p => p.id === "pledge-001");
      if (lightsPledge) {
        recommendations.push({
          ...lightsPledge,
          explanation: `Your electricity usage suggests you might benefit from being more mindful about turning off lights when not in use. This simple habit could reduce your annual usage by 5-10%.`,
          confidence: 0.7,
          impactScore: 0.6,
          priority: "medium"
        });
      }
    }

    // Unplug electronics recommendation
    if (perPersonUsage > 2500) {
      const unplugPledge = allPledges.find(p => p.id === "pledge-003");
      if (unplugPledge) {
        recommendations.push({
          ...unplugPledge,
          explanation: `With your current electricity usage, unplugging electronics when not in use could prevent phantom energy drain and save you $20-40 per year.`,
          confidence: 0.8,
          impactScore: 0.5,
          priority: "medium"
        });
      }
    }

    // Air conditioning recommendation
    if (airConditioning === "frequently") {
      const acPledge = allPledges.find(p => p.id === "pledge-004");
      if (acPledge) {
        recommendations.push({
          ...acPledge,
          explanation: `Since you use air conditioning frequently, adjusting the thermostat 2°C higher could significantly reduce your energy consumption while maintaining comfort.`,
          confidence: 0.9,
          impactScore: 0.9,
          priority: "high"
        });
      }
    }

    // Cold water washing recommendation
    if (perPersonUsage > 2000) {
      const coldWaterPledge = allPledges.find(p => p.id === "pledge-005");
      if (coldWaterPledge) {
        recommendations.push({
          ...coldWaterPledge,
          explanation: `Washing clothes in cold water could reduce your energy consumption for water heating, especially beneficial given your current electricity usage.`,
          confidence: 0.8,
          impactScore: 0.6,
          priority: "medium"
        });
      }
    }

    return recommendations;
  }

  /**
   * Get hot water-specific recommendations
   */
  private static getHotWaterRecommendations(
    hotWater: QuizData["hotWater"], 
    allPledges: Pledge[]
  ): AIRecommendedPledge[] {
    const recommendations: AIRecommendedPledge[] = [];
    
    if (!hotWater) return recommendations;

    const { system, energySaving } = hotWater;

    // Shorter showers recommendation
    if (system === "electric" || system === "gas") {
      const showerPledge = allPledges.find(p => p.id === "pledge-014");
      if (showerPledge) {
        recommendations.push({
          ...showerPledge,
          explanation: `Since you use a ${system} hot water system, reducing shower time by 2-3 minutes could significantly reduce your energy consumption and water usage.`,
          confidence: 0.8,
          impactScore: 0.7,
          priority: "medium"
        });
      }
    }

    // Fix leaky taps recommendation
    const tapsPledge = allPledges.find(p => p.id === "pledge-015");
    if (tapsPledge) {
      recommendations.push({
        ...tapsPledge,
        explanation: `A dripping tap can waste significant water and energy, especially with a ${system} hot water system. Fixing leaks is a quick win for both your wallet and the environment.`,
        confidence: 0.9,
        impactScore: 0.6,
        priority: "medium"
      });
    }

    // Energy-saving hot water system recommendation
    if (system === "electric" && !energySaving) {
      const energyEfficientPledge = allPledges.find(p => p.id === "pledge-022");
      if (energyEfficientPledge) {
        recommendations.push({
          ...energyEfficientPledge,
          explanation: `Your electric hot water system could benefit from energy-efficient upgrades. Consider installing a heat pump or solar hot water system for long-term savings.`,
          confidence: 0.8,
          impactScore: 0.9,
          priority: "high"
        });
      }
    }

    return recommendations;
  }

  /**
   * Get transport-specific recommendations
   */
  private static getTransportRecommendations(
    transport: QuizData["transport"], 
    allPledges: Pledge[]
  ): AIRecommendedPledge[] {
    const recommendations: AIRecommendedPledge[] = [];
    
    if (!transport?.modes) return recommendations;

    const carUsage = transport.modes.find(m => m.mode === "car");
    const activeTransport = transport.modes.filter(m => 
      m.mode === "bicycle" || m.mode === "walking"
    );

    // Walk/cycle for short trips
    if (carUsage && carUsage.distance > 50) {
      const walkPledge = allPledges.find(p => p.id === "pledge-006");
      if (walkPledge) {
        recommendations.push({
          ...walkPledge,
          explanation: `You drive ${carUsage.distance}km per week. Consider walking or cycling for trips under 2km to reduce your carbon footprint and improve your health.`,
          confidence: 0.9,
          impactScore: 0.8,
          priority: "high"
        });
      }
    }

    // Public transport recommendation
    if (carUsage && carUsage.distance > 100) {
      const publicTransportPledge = allPledges.find(p => p.id === "pledge-007");
      if (publicTransportPledge) {
        recommendations.push({
          ...publicTransportPledge,
          explanation: `With your high car usage (${carUsage.distance}km/week), replacing one car trip per week with public transport could significantly reduce your emissions.`,
          confidence: 0.8,
          impactScore: 0.9,
          priority: "high"
        });
      }
    }

    // Carpooling recommendation
    if (carUsage && carUsage.distance > 80) {
      const carpoolPledge = allPledges.find(p => p.id === "pledge-008");
      if (carpoolPledge) {
        recommendations.push({
          ...carpoolPledge,
          explanation: `Carpooling could help reduce your weekly driving distance of ${carUsage.distance}km while sharing costs and reducing emissions.`,
          confidence: 0.7,
          impactScore: 0.8,
          priority: "medium"
        });
      }
    }

    // Combine errands recommendation
    if (carUsage) {
      const errandsPledge = allPledges.find(p => p.id === "pledge-009");
      if (errandsPledge) {
        recommendations.push({
          ...errandsPledge,
          explanation: `Planning your errands to complete multiple tasks in one trip could reduce your total driving distance and save time.`,
          confidence: 0.8,
          impactScore: 0.6,
          priority: "medium"
        });
      }
    }

    return recommendations;
  }

  /**
   * Get appliance-specific recommendations
   */
  private static getApplianceRecommendations(
    appliances: QuizData["appliances"], 
    allPledges: Pledge[]
  ): AIRecommendedPledge[] {
    const recommendations: AIRecommendedPledge[] = [];
    
    if (!appliances?.weeklyUsage) return recommendations;

    const inefficientAppliances = appliances.weeklyUsage.filter(a => !a.energyEfficient);
    const highUsageAppliances = appliances.weeklyUsage.filter(a => a.hoursPerWeek > 20);

    // Energy-efficient appliances recommendation
    if (inefficientAppliances.length > 0) {
      const efficientPledge = allPledges.find(p => p.id === "pledge-022");
      if (efficientPledge) {
        recommendations.push({
          ...efficientPledge,
          explanation: `You have ${inefficientAppliances.length} appliance(s) that aren't energy-efficient. Upgrading to efficient models could reduce your energy consumption significantly.`,
          confidence: 0.8,
          impactScore: 0.7,
          priority: "medium"
        });
      }
    }

    // Unplug electronics recommendation for high usage
    if (highUsageAppliances.length > 0) {
      const unplugPledge = allPledges.find(p => p.id === "pledge-003");
      if (unplugPledge) {
        recommendations.push({
          ...unplugPledge,
          explanation: `With ${highUsageAppliances.length} high-usage appliance(s), unplugging electronics when not in use could prevent significant phantom energy drain.`,
          confidence: 0.9,
          impactScore: 0.6,
          priority: "medium"
        });
      }
    }

    return recommendations;
  }

  /**
   * Get lifestyle recommendations based on overall patterns
   */
  private static getLifestyleRecommendations(
    quizData: QuizData, 
    allPledges: Pledge[]
  ): AIRecommendedPledge[] {
    const recommendations: AIRecommendedPledge[] = [];

    // Meat-free day recommendation
    const meatFreePledge = allPledges.find(p => p.id === "pledge-017");
    if (meatFreePledge) {
      recommendations.push({
        ...meatFreePledge,
        explanation: "Adding one meat-free day per week is a simple way to reduce your carbon footprint while exploring new healthy foods.",
        confidence: 0.8,
        impactScore: 0.7,
        priority: "medium"
      });
    }

    // Local produce recommendation
    const localPledge = allPledges.find(p => p.id === "pledge-018");
    if (localPledge) {
      recommendations.push({
        ...localPledge,
        explanation: "Choosing local and seasonal produce reduces transport emissions and supports local farmers while often being fresher and more nutritious.",
        confidence: 0.7,
        impactScore: 0.6,
        priority: "low"
      });
    }

    // Meal planning recommendation
    const mealPlanPledge = allPledges.find(p => p.id === "pledge-019");
    if (mealPlanPledge) {
      recommendations.push({
        ...mealPlanPledge,
        explanation: "Planning your meals helps reduce food waste, saves money, and ensures you make more sustainable food choices.",
        confidence: 0.8,
        impactScore: 0.7,
        priority: "medium"
      });
    }

    // Reusable bags recommendation
    const bagsPledge = allPledges.find(p => p.id === "pledge-010");
    if (bagsPledge) {
      recommendations.push({
        ...bagsPledge,
        explanation: "Using reusable shopping bags is a simple habit that reduces plastic waste and can save you money on bag fees.",
        confidence: 0.9,
        impactScore: 0.5,
        priority: "low"
      });
    }

    return recommendations;
  }

  /**
   * Convert usage to annual amount
   */
  private static convertToAnnualUsage(usage: number, timeUnit: "month" | "quarter" | "year"): number {
    switch (timeUnit) {
      case "month":
        return usage * 12;
      case "quarter":
        return usage * 4;
      case "year":
        return usage;
      default:
        return usage;
    }
  }
}
