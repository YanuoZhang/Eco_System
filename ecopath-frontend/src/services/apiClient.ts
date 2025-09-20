// API service for client-side usage (browser/components/hooks)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  label: "Critical" | "High Risk" | "Warning" | "Update" | "Positive" | "Neutral" | string;
  image?: string;
  source: string;
  timestamp: string;
  link: string;
  content: string;
}

export interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  cached: boolean;
  lastUpdated: string;
}

export interface TimelineResponse {
  success: boolean;
  data: Array<{
    period: string;
    years: string;
    title?: string;
    dramaticText?: string;
    childPerspective?: string;
    visual?: string;
    events: Array<{
      year: number;
      title: string;
      description: string;
      icon: string;
      category: string;
    }>;
  }>;
  totalPeriods: number;
  totalEvents: number;
  lastUpdated: string;
  source: string;
}

export interface StateData {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async requestWithBody<T>(endpoint: string, method: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    return (await response.json()) as T;
  }

  // News API methods
  async getClimateNews(): Promise<NewsResponse> {
    return this.request<NewsResponse>("/api/news/climate");
  }

  async getNewsByCategory(category: string): Promise<NewsResponse> {
    return this.request<NewsResponse>(`/api/news/climate/category/${category}`);
  }

  async getNewsById(id: string): Promise<{ success: boolean; data: NewsItem }> {
    return this.request<{ success: boolean; data: NewsItem }>(`/api/news/climate/${id}`);
  }

  async updateNews(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/news/climate/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Timeline API methods
  async getTimeline(): Promise<TimelineResponse> {
    return this.request<TimelineResponse>("/api/timeline");
  }

  // States API methods
  async getStates(): Promise<StateData[]> {
    return this.request<StateData[]>("/api/states");
  }

  async getEmissionsFactors(state: string): Promise<unknown> {
    return this.request<unknown>(`/api/emissions/factors?state=${state}`);
  }

  async getEmissionsData(
    state: string,
    range: string = "10y",
  ): Promise<{
    unit: string;
    latest: { year: number; value: string | number } | null;
    data: { year: number; value: string | number }[];
  }> {
    return this.request(`/api/emissions?state=${state}&range=${range}`);
  }

  async getEnergyMixData(state: string): Promise<
    Array<{
      source: string;
      percentage: number;
      generation: string | number;
    }>
  > {
    return this.request(`/api/energy-mix?state=${state}`);
  }

  async getClimateTargets(state: string): Promise<{
    targetYear: number;
    baselineYear: number;
    targetValuePct: number;
    planName: string;
    progress: string | number;
    progressDescription: string;
    latestEmissions: { year: number; value: string | number } | null;
    notes: string;
  }> {
    return this.request(`/api/climate-targets?state=${state}`);
  }

  // Health check
  async getHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    return this.request<{ status: string; database: string; timestamp: string }>("/healthz");
  }

  // Pledges (public)
  async getPublicPledges(params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    impact?: string;
  }) {
    const q = new URLSearchParams();
    if (params?.page !== undefined) q.append("page", String(params.page));
    if (params?.limit !== undefined) q.append("limit", String(params.limit));
    if (params?.category) q.append("category", params.category);
    if (params?.difficulty) q.append("difficulty", params.difficulty);
    if (params?.impact) q.append("impact", params.impact);
    const qs = q.toString();
    return this.request(`/api/pledges${qs ? `?${qs}` : ""}`);
  }

  async getPledgeCategories() {
    return this.request(`/api/pledges/categories`);
  }

  async searchPledges(q: string) {
    return this.request(`/api/pledges/search?q=${encodeURIComponent(q)}`);
  }

  async getPledgeById(id: string) {
    return this.request(`/api/pledges/${id}`);
  }

  async getAiRecommendations(quizData: unknown) {
    return this.requestWithBody(`/api/pledges/ai-recommendations`, "POST", quizData);
  }

  // User pledges (in-memory server storage)
  async listUserPledges(userId: string) {
    return this.request(`/api/pledges/user?userId=${encodeURIComponent(userId)}`);
  }

  async saveUserPledges(body: {
    userId: string;
    pledges: Array<{ pledgeId: string; reminderType?: string; customDate?: string }>;
  }) {
    return this.requestWithBody(`/api/pledges/user`, "POST", body);
  }

  async rescheduleUserPledge(
    recordId: string,
    body: { userId: string; reminderType?: string; customDate?: string },
  ) {
    return this.requestWithBody(`/api/pledges/user/${encodeURIComponent(recordId)}`, "PATCH", body);
  }

  async deleteUserPledge(recordId: string, userId: string) {
    // Allow sending userId in body for convenience
    return this.requestWithBody(`/api/pledges/user/${encodeURIComponent(recordId)}`, "DELETE", {
      userId,
    });
  }
}

export const apiClient = new ApiService();
export default apiClient;
