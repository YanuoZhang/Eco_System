import { Pledge, PledgeListResponse } from "../types";

// In-memory sample data; can be swapped to DB later
const pledges: Pledge[] = [
  {
    id: "pledge-001",
    title: "Turn off lights when not in use",
    description: "Switch off lights when leaving a room to avoid phantom usage.",
    category: "energy",
    difficulty: "easy",
    impact: "medium",
    estimatedSavings: "Save $30-50/year",
    estimatedCO2Reduction: "Reduce 50kg CO2/year",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class PledgesService {
  static async getPublicPledges(
    page = 1,
    limit = 10,
    category?: string,
    difficulty?: string,
    impact?: string,
  ): Promise<PledgeListResponse> {
    let data = pledges.filter((p) => p.isPublic);
    if (category) data = data.filter((p) => p.category === category);
    if (difficulty) data = data.filter((p) => p.difficulty === difficulty);
    if (impact) data = data.filter((p) => p.impact === impact);

    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = data.slice(start, start + limit);

    return {
      success: true,
      data: paged,
      totalPledges: total,
      categories: Array.from(new Set(pledges.map((p) => p.category))),
      pagination: { page, limit, total, totalPages },
      timestamp: new Date().toISOString(),
    };
  }

  static async getCategories(): Promise<string[]> {
    return Array.from(new Set(pledges.map((p) => p.category)));
  }

  static async searchPledges(query: string): Promise<Pledge[]> {
    const q = query.toLowerCase();
    return pledges.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }

  static async getPledgeById(id: string): Promise<Pledge | undefined> {
    return pledges.find((p) => p.id === id);
  }
}
