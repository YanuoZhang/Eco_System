// Common types and interfaces for the EcoPath backend

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  label: "Critical" | "Update" | "Positive" | "Neutral" | "High Risk" | "Warning";
  image?: string;
  source: string;
  timestamp: string;
  link: string;
  content?: string;
}

export interface ClimateEvent {
  year: number;
  title: string;
  description: string;
  icon?: string;
  category: "scientific" | "political" | "environmental" | "technological" | "social";
}

export interface TimelinePeriod {
  period: string;
  years: string;
  // Optional rich fields to support frontend story timeline
  title?: string;
  dramaticText?: string;
  childPerspective?: string;
  visual?: string;
  events: ClimateEvent[];
}

// Energy data types
export interface EnergyData {
  electricity?: number; // kWh
  gas?: number; // MJ or kWh equivalent
  timeUnit: "month" | "quarter" | "year";
}

export interface TransportData {
  mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking";
  distance: number; // km
  timeUnit: "day" | "week" | "month" | "year";
  frequency?: number; // trips per time unit
}

export interface EmissionsCalculationRequest {
  energy?: EnergyData;
  transport?: TransportData;
  state: string; // For energy mix calculations
}

export interface EmissionsCalculationResponse {
  totalEmissions: number; // kg CO2-e
  breakdown: {
    energy?: {
      electricity: number;
      gas: number;
      total: number;
    };
    transport?: {
      [key: string]: number; // mode-specific emissions
      total: number;
    };
  };
  timeUnit: string;
  calculationDate: string;
}

export interface FactorOverrides {
  electricityKgPerKwh?: number | null;
  gasKgPerGJ?: number | null;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pledge types
export interface Pledge {
  id: string;
  title: string;
  description: string;
  category: "energy" | "transport" | "waste" | "water" | "food" | "lifestyle";
  difficulty: "easy" | "medium" | "hard";
  impact: "low" | "medium" | "high";
  estimatedSavings?: string; // e.g., "Save $50/year"
  estimatedCO2Reduction?: string; // e.g., "Reduce 100kg CO2/year"
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PledgeListResponse extends PaginatedResponse<Pledge> {
  categories?: string[];
  totalPledges: number;
}

// Quiz data types for AI recommendations
export interface QuizData {
  location?: {
    state: string;
    city?: string;
  };
  electricity?: {
    usage: number; // kWh per period
    timeUnit: "month" | "quarter" | "year";
    bill?: number; // $ per period
    household: number;
    ledBulbs?: "yes" | "no" | "mixed";
    airConditioning?: "frequently" | "rarely" | "seasonally";
    efficientAppliances?: "yes" | "no" | "mixed";
  };
  hotWater?: {
    system: "electric" | "gas" | "solar";
    usage?: number; // kWh or MJ per period
    timeUnit: "month" | "quarter" | "year";
    household: number;
    energySaving: boolean;
  };
  transport?: {
    modes: Array<{
      mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking";
      distance: number; // km per week
      frequency: number; // trips per week
    }>;
  };
  appliances?: {
    weeklyUsage: Array<{
      appliance: string;
      hoursPerWeek: number;
      energyEfficient: boolean;
    }>;
  };
}

export interface AIRecommendedPledge extends Pledge {
  explanation: string; // Why this pledge was recommended
  confidence: number; // 0-1 confidence score
  impactScore: number; // 0-1 impact potential for this user
  priority: "high" | "medium" | "low";
}

export interface AIRecommendationResponse extends ApiResponse<AIRecommendedPledge[]> {
  quizData?: QuizData;
  totalRecommendations: number;
  insights?: string[]; // Key insights about user's carbon footprint
}