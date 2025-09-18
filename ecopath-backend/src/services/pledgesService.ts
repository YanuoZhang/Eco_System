import { Pledge, PledgeListResponse } from "../types";

// Sample pledge data - simple and actionable eco-friendly pledges
const samplePledges: Pledge[] = [
  // Energy Category
  {
    id: "pledge-001",
    title: "Turn off lights when not in use",
    description: "Make it a habit to switch off lights when leaving a room, even for short periods.",
    category: "energy",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $30-50/year",
    estimatedCO2Reduction: "Reduce 50kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-002",
    title: "Use LED light bulbs",
    description: "Replace incandescent bulbs with energy-efficient LED bulbs throughout your home.",
    category: "energy",
    difficulty: "easy",
    impact: "high",
    estimatedSavings: "Save $100-200/year",
    estimatedCO2Reduction: "Reduce 200kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-003",
    title: "Unplug electronics when not in use",
    description: "Unplug chargers, appliances, and electronics when not actively using them to prevent phantom energy drain.",
    category: "energy",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $20-40/year",
    estimatedCO2Reduction: "Reduce 30kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-004",
    title: "Set thermostat 2°C higher in summer",
    description: "Adjust your air conditioning thermostat 2°C higher to reduce energy consumption while staying comfortable.",
    category: "energy",
    difficulty: "easy",
    impact: "high",
    estimatedSavings: "Save $80-150/year",
    estimatedCO2Reduction: "Reduce 150kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-005",
    title: "Wash clothes in cold water",
    description: "Use cold water for most laundry loads to save energy on water heating.",
    category: "energy",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $40-80/year",
    estimatedCO2Reduction: "Reduce 80kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },

  // Transport Category
  {
    id: "pledge-006",
    title: "Walk or cycle for short trips",
    description: "Choose walking or cycling for trips under 2km instead of driving.",
    category: "transport",
    difficulty: "easy",
    impact: "high",
    estimatedSavings: "Save $200-400/year",
    estimatedCO2Reduction: "Reduce 300kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-007",
    title: "Use public transport once a week",
    description: "Replace one car trip per week with public transport, cycling, or walking.",
    category: "transport",
    difficulty: "medium",
    impact: "high",
    estimatedSavings: "Save $100-200/year",
    estimatedCO2Reduction: "Reduce 200kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-008",
    title: "Carpool for work or school",
    description: "Share rides with colleagues or classmates to reduce individual car usage.",
    category: "transport",
    difficulty: "medium",
    impact: "high",
    estimatedSavings: "Save $300-600/year",
    estimatedCO2Reduction: "Reduce 400kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-009",
    title: "Combine errands into one trip",
    description: "Plan your errands to complete multiple tasks in a single car trip.",
    category: "transport",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $50-100/year",
    estimatedCO2Reduction: "Reduce 100kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },

  // Waste Category
  {
    id: "pledge-010",
    title: "Use reusable shopping bags",
    description: "Bring your own reusable bags when shopping to reduce plastic waste.",
    category: "waste",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $10-20/year",
    estimatedCO2Reduction: "Reduce 20kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-011",
    title: "Start composting food scraps",
    description: "Compost fruit and vegetable scraps to reduce food waste and create nutrient-rich soil.",
    category: "waste",
    difficulty: "medium",
    impact: "high",
    estimatedSavings: "Save $30-60/year",
    estimatedCO2Reduction: "Reduce 100kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-012",
    title: "Buy products with less packaging",
    description: "Choose products with minimal or recyclable packaging when shopping.",
    category: "waste",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $20-40/year",
    estimatedCO2Reduction: "Reduce 50kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-013",
    title: "Use a reusable water bottle",
    description: "Carry a reusable water bottle instead of buying single-use plastic bottles.",
    category: "waste",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $100-200/year",
    estimatedCO2Reduction: "Reduce 30kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },

  // Water Category
  {
    id: "pledge-014",
    title: "Take shorter showers",
    description: "Reduce shower time by 2-3 minutes to save water and energy.",
    category: "water",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $50-100/year",
    estimatedCO2Reduction: "Reduce 60kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-015",
    title: "Fix leaky taps",
    description: "Repair or replace dripping taps to prevent water waste.",
    category: "water",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $30-60/year",
    estimatedCO2Reduction: "Reduce 40kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-016",
    title: "Water plants in the morning",
    description: "Water your garden in the early morning to reduce evaporation and water waste.",
    category: "water",
    difficulty: "easy",
    impact: "low",
    estimatedSavings: "Save $20-40/year",
    estimatedCO2Reduction: "Reduce 20kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },

  // Food Category
  {
    id: "pledge-017",
    title: "Have one meat-free day per week",
    description: "Choose vegetarian or vegan meals one day each week to reduce your carbon footprint.",
    category: "food",
    difficulty: "easy",
    impact: "high",
    estimatedSavings: "Save $50-100/year",
    estimatedCO2Reduction: "Reduce 200kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-018",
    title: "Buy local and seasonal produce",
    description: "Choose locally grown, seasonal fruits and vegetables to reduce transport emissions.",
    category: "food",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $30-60/year",
    estimatedCO2Reduction: "Reduce 80kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-019",
    title: "Plan meals to reduce food waste",
    description: "Plan your weekly meals and buy only what you need to minimize food waste.",
    category: "food",
    difficulty: "medium",
    impact: "high",
    estimatedSavings: "Save $200-400/year",
    estimatedCO2Reduction: "Reduce 150kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-020",
    title: "Use leftovers creatively",
    description: "Transform leftovers into new meals instead of throwing them away.",
    category: "food",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $100-200/year",
    estimatedCO2Reduction: "Reduce 100kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },

  // Lifestyle Category
  {
    id: "pledge-021",
    title: "Buy second-hand when possible",
    description: "Choose pre-owned items for clothing, furniture, and electronics to reduce waste.",
    category: "lifestyle",
    difficulty: "easy",
    impact: "high",
    estimatedSavings: "Save $200-500/year",
    estimatedCO2Reduction: "Reduce 300kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-022",
    title: "Repair instead of replace",
    description: "Fix broken items when possible instead of immediately buying new ones.",
    category: "lifestyle",
    difficulty: "medium",
    impact: "high",
    estimatedSavings: "Save $100-300/year",
    estimatedCO2Reduction: "Reduce 200kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-023",
    title: "Use digital receipts",
    description: "Opt for digital receipts instead of paper ones when shopping.",
    category: "lifestyle",
    difficulty: "easy",
    impact: "low",
    estimatedSavings: "Save $5-10/year",
    estimatedCO2Reduction: "Reduce 5kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-024",
    title: "Plant a tree or garden",
    description: "Plant a tree in your yard or start a small vegetable garden to absorb CO2.",
    category: "lifestyle",
    difficulty: "medium",
    impact: "high",
    estimatedSavings: "Save $50-150/year",
    estimatedCO2Reduction: "Reduce 100kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "pledge-025",
    title: "Support eco-friendly businesses",
    description: "Choose to buy from companies that prioritize sustainability and environmental responsibility.",
    category: "lifestyle",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $20-50/year",
    estimatedCO2Reduction: "Reduce 50kg CO2/year",
    isPublic: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  }
];

export class PledgesService {
  /**
   * Get all public pledges with optional filtering and pagination
   */
  static async getPublicPledges(
    page: number = 1,
    limit: number = 10,
    category?: string,
    difficulty?: string,
    impact?: string
  ): Promise<PledgeListResponse> {
    let filteredPledges = samplePledges.filter(pledge => pledge.isPublic);

    // Apply filters
    if (category) {
      filteredPledges = filteredPledges.filter(pledge => pledge.category === category);
    }
    if (difficulty) {
      filteredPledges = filteredPledges.filter(pledge => pledge.difficulty === difficulty);
    }
    if (impact) {
      filteredPledges = filteredPledges.filter(pledge => pledge.impact === impact);
    }

    // Calculate pagination
    const total = filteredPledges.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPledges = filteredPledges.slice(startIndex, endIndex);

    // Get unique categories
    const categories = [...new Set(samplePledges.map(pledge => pledge.category))];

    return {
      success: true,
      data: paginatedPledges,
      totalPledges: total,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get a specific pledge by ID
   */
  static async getPledgeById(id: string): Promise<Pledge | null> {
    return samplePledges.find(pledge => pledge.id === id) || null;
  }

  /**
   * Get pledges by category
   */
  static async getPledgesByCategory(category: string): Promise<Pledge[]> {
    return samplePledges.filter(pledge => 
      pledge.category === category && pledge.isPublic
    );
  }

  /**
   * Get all available categories
   */
  static async getCategories(): Promise<string[]> {
    return [...new Set(samplePledges.map(pledge => pledge.category))];
  }

  /**
   * Search pledges by title or description
   */
  static async searchPledges(query: string): Promise<Pledge[]> {
    const searchTerm = query.toLowerCase();
    return samplePledges.filter(pledge => 
      pledge.isPublic && (
        pledge.title.toLowerCase().includes(searchTerm) ||
        pledge.description.toLowerCase().includes(searchTerm)
      )
    );
  }
}
