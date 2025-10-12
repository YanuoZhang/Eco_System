// User impact summary service

import { UserPledgesService } from "./userPledgesService";
import { PledgesService } from "./pledgesService";
import { CommunityService } from "./communityService";

export interface UserImpactSummary {
  activePledges: number;
  co2SavedKg: number;
  reductionPercent: number;
  equivalents: {
    treesPlanted: number;
    milesNotDriven: number;
    ledBulbs: number;
  };
  communityCO2SavedKg: number;
  completedPledges: string[];
  lastUpdated: string;
}

// Equivalent conversion factors
const EQUIVALENT_FACTORS = {
  TREE_CO2_KG_PER_YEAR: 21, // 1 tree absorbs ~21kg CO2/year
  MILE_CO2_KG: 0.411, // 1 mile driven emits ~0.411kg CO2
  LED_BULB_CO2_KG_PER_YEAR: 2.7, // 1 LED bulb saves ~2.7kg CO2/year vs incandescent
} as const;

// Baseline emissions for reduction percentage calculation
const BASELINE_EMISSIONS_KG = 15000; // Average Australian household emissions per year

export class UserImpactService {
  /**
   * Get comprehensive impact summary for authenticated user
   */
  static async getUserImpactSummary(userId: string): Promise<UserImpactSummary> {
    // Get user pledges
    const userPledges = await UserPledgesService.list(userId);

    if (userPledges.length === 0) {
      return this.getEmptyImpactSummary();
    }

    // Calculate CO2 savings from pledges
    let totalCO2SavedKg = 0;
    const completedPledgeNames: string[] = [];

    for (const userPledge of userPledges) {
      const pledge = await PledgesService.getPledgeById(userPledge.pledgeId);
      if (!pledge) continue;

      completedPledgeNames.push(pledge.title || userPledge.pledgeId);

      // Calculate CO2 savings for this pledge
      const savingsKg = this.calculatePledgeSavings(pledge);
      totalCO2SavedKg += savingsKg;
    }

    // Calculate reduction percentage
    const reductionPercent = Math.round((totalCO2SavedKg / BASELINE_EMISSIONS_KG) * 100);

    // Calculate equivalent metrics
    const equivalents = this.calculateEquivalents(totalCO2SavedKg);

    // Get community total (with fallback)
    let communityCO2SavedKg = 0;
    try {
      const communityData = await CommunityService.getCommunityFootprint();
      communityCO2SavedKg = communityData.totalCO2SavedKg;
    } catch (error) {
      console.warn("Failed to fetch community data:", error);
      // Fallback to 0 if community service fails
    }

    return {
      activePledges: userPledges.length,
      co2SavedKg: Math.round(totalCO2SavedKg),
      reductionPercent: Math.max(0, Math.min(100, reductionPercent)), // Clamp between 0-100%
      equivalents,
      communityCO2SavedKg,
      completedPledges: completedPledgeNames,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate CO2 savings for a single pledge
   */
  private static calculatePledgeSavings(pledge: any): number {
    // Try to parse estimatedCO2Reduction
    if (pledge.estimatedCO2Reduction) {
      const match = String(pledge.estimatedCO2Reduction).match(/(\d+(?:\.\d+)?)\s*(kg|t)/i);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        return unit === "t" ? value * 1000 : value;
      }
    }

    // Fallback to category defaults
    const categoryDefaults: Record<string, number> = {
      transport: 350,
      energy: 120,
      diet: 200,
      water: 80,
      lifestyle: 90,
      waste: 60,
      other: 100,
    };

    return categoryDefaults[pledge.category] || categoryDefaults.other;
  }

  /**
   * Calculate equivalent impact metrics
   */
  private static calculateEquivalents(co2SavedKg: number): {
    treesPlanted: number;
    milesNotDriven: number;
    ledBulbs: number;
  } {
    return {
      treesPlanted: Math.round(co2SavedKg / EQUIVALENT_FACTORS.TREE_CO2_KG_PER_YEAR),
      milesNotDriven: Math.round(co2SavedKg / EQUIVALENT_FACTORS.MILE_CO2_KG),
      ledBulbs: Math.round(co2SavedKg / EQUIVALENT_FACTORS.LED_BULB_CO2_KG_PER_YEAR),
    };
  }

  /**
   * Return empty impact summary for users with no pledges
   */
  private static getEmptyImpactSummary(): UserImpactSummary {
    return {
      activePledges: 0,
      co2SavedKg: 0,
      reductionPercent: 0,
      equivalents: {
        treesPlanted: 0,
        milesNotDriven: 0,
        ledBulbs: 0,
      },
      communityCO2SavedKg: 0,
      completedPledges: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}
