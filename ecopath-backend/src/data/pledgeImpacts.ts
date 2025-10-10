// Pre-calculated pledge impact values to avoid slow Gemini AI calls
// Values are in kg CO2 per person per year

export interface PledgeImpactData {
  title: string;
  category: string;
  per_person_kg_per_year: number;
  confidence: number;
  rationale: string;
}

export const PREDEFINED_PLEDGE_IMPACTS: Record<string, PledgeImpactData> = {
  // Transport pledges
  "bike to work twice weekly": {
    title: "Bike to Work Twice Weekly",
    category: "TRANSPORT",
    per_person_kg_per_year: 520,
    confidence: 0.85,
    rationale:
      "Based on average commute distance of 15km, replacing 2 car trips per week saves ~10kg CO2/week",
  },
  "use public transport": {
    title: "Use Public Transport",
    category: "TRANSPORT",
    per_person_kg_per_year: 840,
    confidence: 0.9,
    rationale: "Switching from car to public transport for daily commute reduces emissions by ~70%",
  },
  "carpool to work": {
    title: "Carpool to Work",
    category: "TRANSPORT",
    per_person_kg_per_year: 600,
    confidence: 0.85,
    rationale: "Sharing rides reduces per-person emissions by approximately 50%",
  },

  // Food/Diet pledges
  "meatless monday": {
    title: "Meatless Monday",
    category: "FOOD",
    per_person_kg_per_year: 600,
    confidence: 0.9,
    rationale:
      "Avoiding meat one day per week saves ~12kg CO2/week based on average meat consumption",
  },
  "try meatless mondays": {
    title: "Try Meatless Mondays",
    category: "FOOD",
    per_person_kg_per_year: 600,
    confidence: 0.9,
    rationale:
      "Avoiding meat one day per week saves ~12kg CO2/week based on average meat consumption",
  },
  "reduce food waste": {
    title: "Reduce Food Waste",
    category: "FOOD",
    per_person_kg_per_year: 400,
    confidence: 0.8,
    rationale:
      "Average household wastes 20% of food; reducing this by half saves significant emissions",
  },
  "buy local produce": {
    title: "Buy Local Produce",
    category: "FOOD",
    per_person_kg_per_year: 200,
    confidence: 0.75,
    rationale: "Reducing food miles and supporting local agriculture",
  },

  // Energy pledges
  "switch to led bulbs": {
    title: "Switch to LED Bulbs",
    category: "ENERGY",
    per_person_kg_per_year: 180,
    confidence: 0.95,
    rationale: "LED bulbs use 75% less energy than incandescent; average household has 20-30 bulbs",
  },
  "unplug and switch off": {
    title: "Unplug and Switch Off",
    category: "ENERGY",
    per_person_kg_per_year: 150,
    confidence: 0.8,
    rationale: "Phantom power accounts for 5-10% of household electricity use",
  },
  "air dry clothes": {
    title: "Air Dry Clothes",
    category: "ENERGY",
    per_person_kg_per_year: 300,
    confidence: 0.85,
    rationale: "Dryers are one of the highest energy-consuming appliances",
  },
  "use renewable energy": {
    title: "Use Renewable Energy",
    category: "ENERGY",
    per_person_kg_per_year: 2000,
    confidence: 0.95,
    rationale: "Switching to 100% renewable electricity eliminates household electricity emissions",
  },
  "install solar panels": {
    title: "Install Solar Panels",
    category: "ENERGY",
    per_person_kg_per_year: 1500,
    confidence: 0.9,
    rationale: "Average residential solar system offsets 3-4 tons CO2 annually",
  },

  // Water pledges
  "take shorter showers": {
    title: "Take Shorter Showers",
    category: "WATER",
    per_person_kg_per_year: 100,
    confidence: 0.8,
    rationale: "Reducing hot water use saves energy for water heating",
  },
  "fix water leaks": {
    title: "Fix Water Leaks",
    category: "WATER",
    per_person_kg_per_year: 80,
    confidence: 0.75,
    rationale: "Prevents waste of treated water and associated energy",
  },

  // Waste pledges
  "recycle properly": {
    title: "Recycle Properly",
    category: "WASTE",
    per_person_kg_per_year: 250,
    confidence: 0.85,
    rationale: "Proper recycling reduces emissions from manufacturing new products",
  },
  "compost organic waste": {
    title: "Compost Organic Waste",
    category: "WASTE",
    per_person_kg_per_year: 200,
    confidence: 0.8,
    rationale: "Prevents methane emissions from landfills",
  },
  "reduce single-use plastics": {
    title: "Reduce Single-Use Plastics",
    category: "WASTE",
    per_person_kg_per_year: 150,
    confidence: 0.75,
    rationale: "Reduces emissions from plastic production and disposal",
  },
};

// Fallback values by category if specific pledge not found
export const CATEGORY_FALLBACK_IMPACTS: Record<string, number> = {
  TRANSPORT: 500,
  FOOD: 400,
  ENERGY: 300,
  WATER: 100,
  WASTE: 200,
  OTHER: 150,
};

export function getPledgeImpact(title: string, category?: string): PledgeImpactData {
  const normalizedTitle = title.toLowerCase().trim();

  // Try to find exact match
  if (PREDEFINED_PLEDGE_IMPACTS[normalizedTitle]) {
    return PREDEFINED_PLEDGE_IMPACTS[normalizedTitle];
  }

  // Use category fallback
  const fallbackValue = category ? CATEGORY_FALLBACK_IMPACTS[category] || 150 : 150;

  return {
    title,
    category: category || "OTHER",
    per_person_kg_per_year: fallbackValue,
    confidence: 0.6,
    rationale: `Estimated based on ${category || "general"} category average`,
  };
}
