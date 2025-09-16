// API service for connecting to the backend
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

  async getTimelineByPeriod(period: string): Promise<TimelineResponse> {
    return this.request<TimelineResponse>(`/api/timeline/${period}`);
  }

  // States API methods
  async getStates(): Promise<StateData[]> {
    return this.request<StateData[]>("/api/states");
  }

  async getEmissionsFactors(state: string): Promise<unknown> {
    return this.request<unknown>(`/api/emissions/factors?state=${state}`);
  }

  // Health check
  async getHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    return this.request<{ status: string; database: string; timestamp: string }>("/healthz");
  }
}

export const apiService = new ApiService();
export default apiService;
