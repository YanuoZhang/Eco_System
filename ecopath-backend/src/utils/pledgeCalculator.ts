/**
 * Unified pledge impact calculation utility
 * This is the single source of truth for all pledge savings calculations
 * Based on specific pledge types with fixed savings values
 */

export function calculatePledgeImpact(title: string, category: string, _baseline?: number): number {
  const titleLower = title.toLowerCase();

  // Specific pledge savings based on title keywords
  const pledgeSavings: Array<{ keywords: string[]; savings: number }> = [
    // Energy pledges
    { keywords: ["switch to led bulbs", "led bulbs", "led"], savings: 150 },
    { keywords: ["air-dry", "air dry", "laundry", "dryer"], savings: 180 },
    { keywords: ["unplug", "standby", "phantom"], savings: 120 },
    { keywords: ["thermostat", "heating", "cooling"], savings: 200 },
    { keywords: ["appliance", "efficient", "energy star"], savings: 100 },
    { keywords: ["solar", "renewable"], savings: 800 },

    // Water pledges
    { keywords: ["5-minute showers", "shower", "showers"], savings: 400 },
    { keywords: ["dishwasher", "washing", "cold water"], savings: 150 },
    { keywords: ["leak", "faucet"], savings: 80 },
    { keywords: ["water bottle", "reusable water"], savings: 50 },

    // Transport pledges
    { keywords: ["bike", "cycling", "bicycle"], savings: 800 },
    { keywords: ["walk", "walking"], savings: 300 },
    { keywords: ["public", "transit", "bus", "train"], savings: 1000 },
    { keywords: ["carpool", "ride"], savings: 400 },
    { keywords: ["drive", "car", "fuel", "efficient"], savings: 200 },
    { keywords: ["electric", "vehicle", "ev"], savings: 1200 },

    // Food pledges
    { keywords: ["meatless", "vegetarian", "vegan"], savings: 600 },
    { keywords: ["local", "organic"], savings: 200 },
    { keywords: ["waste", "compost"], savings: 150 },
    { keywords: ["grow herbs", "herbs", "garden", "grow"], savings: 100 },

    // Waste pledges
    { keywords: ["recycle", "recycling"], savings: 80 },
    { keywords: ["plastic", "bottle", "reusable"], savings: 60 },
    { keywords: ["zero", "waste"], savings: 200 },

    // Lifestyle pledges
    { keywords: ["digital", "paperless"], savings: 30 },
    { keywords: ["repair", "fix"], savings: 50 },
    { keywords: ["second-hand", "used"], savings: 100 },
  ];

  // Find the first matching pledge
  for (const pledge of pledgeSavings) {
    if (pledge.keywords.some((keyword) => titleLower.includes(keyword))) {
      return pledge.savings;
    }
  }

  // Fallback to category-based savings if no specific match
  const categorySavings: Record<string, number> = {
    energy: 120,
    water: 80,
    transport: 350,
    food: 200,
    diet: 200,
    waste: 60,
    lifestyle: 90,
    daily: 90,
    general: 100,
    other: 100,
  };

  return categorySavings[category.toLowerCase()] || 100;
}

/**
 * Calculate pledge savings for services that don't have access to baseline
 * This provides fixed values based on category as a fallback
 */
export function calculatePledgeSavingsFallback(pledge: any): number {
  // Try to parse estimatedCO2Reduction
  if (pledge.estimatedCO2Reduction) {
    const match = String(pledge.estimatedCO2Reduction).match(/(\d+(?:\.\d+)?)\s*(kg|t)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      return unit === "t" ? value * 1000 : value;
    }
  }

  // Fallback to category defaults (scaled up from original values)
  const categoryDefaults: Record<string, number> = {
    transport: 1200, // e.g., public transport / cycling
    energy: 800, // e.g., LED bulbs or thermostat tweaks
    diet: 600, // e.g., meatless monday
    food: 600, // alias for diet
    water: 400, // e.g., shorter showers
    lifestyle: 300, // e.g., cold-wash laundry / reduce food waste
    daily: 300, // alias for lifestyle
    waste: 200, // e.g., recycling
    general: 300, // general pledges
    other: 300, // default
  };

  return categoryDefaults[pledge.category?.toLowerCase() || "other"] || 300;
}
