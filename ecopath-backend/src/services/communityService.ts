// Community footprint aggregation service

import { PledgesService } from "./pledgesService";
import { calculatePledgeImpact } from "../utils/pledgeCalculator";

export interface CommunityFootprint {
  totalCO2SavedKg: number;
  activeMembers: number;
  categories: Array<{
    name: string;
    kg: number;
    percentage: number;
  }>;
  lastUpdated: string;
}

export interface CommunityCategoryData {
  name: string;
  kg: number;
  percentage: number;
}

// In-memory cache for community data (in production, use Redis)
const communityCache = new Map<string, { data: CommunityFootprint; expiresAt: number }>();
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export class CommunityService {
  /**
   * Get community footprint data with caching
   */
  static async getCommunityFootprint(): Promise<CommunityFootprint> {
    const cacheKey = "community_footprint";
    const now = Date.now();

    // Check cache
    const cached = communityCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    // Generate fresh data
    const data = await this.generateCommunityFootprint();

    // Cache for 24 hours
    communityCache.set(cacheKey, {
      data,
      expiresAt: now + CACHE_DURATION_MS,
    });

    return data;
  }

  /**
   * Force refresh community data (admin use)
   */
  static async refreshCommunityData(): Promise<CommunityFootprint> {
    const data = await this.generateCommunityFootprint();

    // Update cache
    communityCache.set("community_footprint", {
      data,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    });

    return data;
  }

  /**
   * Generate fresh community footprint data
   */
  private static async generateCommunityFootprint(): Promise<CommunityFootprint> {
    // Get all user pledges from the in-memory store
    // In a real implementation, this would query a database
    const allUserPledges = this.getAllUserPledges();

    if (allUserPledges.length === 0) {
      return this.getEmptyFootprint();
    }

    // Aggregate data by category
    const categoryTotals = new Map<string, number>();
    const activeUsers = new Set<string>();
    let totalCO2Kg = 0;

    for (const userPledge of allUserPledges) {
      const pledge = await PledgesService.getPledgeById(userPledge.pledgeId);
      if (!pledge) continue;

      activeUsers.add(userPledge.userId);

      // Calculate CO2 savings for this pledge
      const savingsKg = this.calculatePledgeSavings(pledge);
      totalCO2Kg += savingsKg;

      // Add to category total
      const category = pledge.category || "other";
      const currentTotal = categoryTotals.get(category) || 0;
      categoryTotals.set(category, currentTotal + savingsKg);
    }

    // Convert category totals to array with percentages
    const categories = this.calculateCategoryPercentages(categoryTotals, totalCO2Kg);

    return {
      totalCO2SavedKg: Math.round(totalCO2Kg),
      activeMembers: activeUsers.size,
      categories,
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

    // Use unified calculation logic
    const title = pledge.title?.toLowerCase() || "";
    const category = pledge.category?.toLowerCase() || "other";
    return calculatePledgeImpact(title, category);
  }

  /**
   * Calculate category percentages ensuring they sum to 100%
   */
  private static calculateCategoryPercentages(
    categoryTotals: Map<string, number>,
    totalCO2Kg: number,
  ): CommunityCategoryData[] {
    if (totalCO2Kg === 0) {
      return [];
    }

    const categories: CommunityCategoryData[] = [];
    let totalPercentage = 0;

    // First pass: calculate percentages
    for (const [category, kg] of categoryTotals) {
      const percentage = Math.round((kg / totalCO2Kg) * 100);
      categories.push({
        name: this.formatCategoryName(category),
        kg: Math.round(kg),
        percentage,
      });
      totalPercentage += percentage;
    }

    // Sort by kg descending
    categories.sort((a, b) => b.kg - a.kg);

    // Adjust percentages to ensure they sum to 100%
    const adjustment = 100 - totalPercentage;
    if (adjustment !== 0 && categories.length > 0) {
      // Add/subtract the difference to the largest category
      categories[0].percentage += adjustment;
      // Ensure percentage doesn't go below 0
      if (categories[0].percentage < 0) {
        categories[0].percentage = 0;
      }
    }

    return categories;
  }

  /**
   * Format category names for display
   */
  private static formatCategoryName(category: string): string {
    const categoryMap: Record<string, string> = {
      transport: "Transport",
      energy: "Energy",
      diet: "Diet",
      water: "Water",
      lifestyle: "Lifestyle",
      waste: "Waste",
      other: "Other",
    };

    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Get all user pledges (simulated - in production, query database)
   */
  private static getAllUserPledges(): Array<{
    userId: string;
    pledgeId: string;
    dateAdded: string;
  }> {
    // This is a simplified implementation for the in-memory store
    // In production, this would query the database for all user pledges
    const allPledges: Array<{ userId: string; pledgeId: string; dateAdded: string }> = [];

    // For now, return empty array - this would be populated from database
    // In a real implementation, you'd have something like:
    // return await database.query('SELECT userId, pledgeId, dateAdded FROM user_pledges');

    return allPledges;
  }

  /**
   * Return empty footprint for edge cases
   */
  private static getEmptyFootprint(): CommunityFootprint {
    return {
      totalCO2SavedKg: 0,
      activeMembers: 0,
      categories: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}
