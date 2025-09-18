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

// Pledge types (aligned with backend pledge API branch)
export interface Pledge {
  id: string;
  title: string;
  description: string;
  category: "energy" | "transport" | "waste" | "water" | "food" | "lifestyle";
  difficulty: "easy" | "medium" | "hard";
  impact: "low" | "medium" | "high";
  estimatedSavings?: string;
  estimatedCO2Reduction?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PledgeListResponse extends ApiResponse<Pledge[]> {
  totalPledges?: number;
  categories?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QuizData {
  location?: { state?: string; city?: string };
  electricity?: {
    usage?: number;
    timeUnit?: "month" | "quarter" | "year";
    bill?: number;
    household?: number;
    ledBulbs?: "yes" | "no" | "mixed";
    airConditioning?: "frequently" | "rarely" | "seasonally";
    efficientAppliances?: "yes" | "no" | "mixed";
  };
  hotWater?: {
    system?: "electric" | "gas" | "solar";
    usage?: number;
    timeUnit?: "month" | "quarter" | "year";
    household?: number;
    energySaving?: boolean;
  };
  transport?: {
    modes?: Array<{
      mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking";
      distance?: number;
      frequency?: number;
    }>;
  };
  appliances?: {
    weeklyUsage?: Array<{ appliance: string; hoursPerWeek?: number; energyEfficient?: boolean }>;
  };
}

export interface AIRecommendedPledge {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  impactScore: number;
  reasoning?: string;
}

export interface AIRecommendationResponse extends ApiResponse<AIRecommendedPledge[]> {
  totalRecommendations?: number;
  quizData?: QuizData;
  insights?: string[];
}

// User pledge types for persistence APIs
export type ReminderType = "once" | "daily" | "weekly" | "custom";

export interface UserPledge {
  id: string; // server-side UUID for this saved pledge record
  userId: string;
  pledgeId: string;
  title?: string;
  icon?: string;
  reminderType?: ReminderType;
  customDate?: string; // ISO date
  dateAdded: string; // ISO datetime
}

export interface SaveUserPledgesRequest {
  userId: string;
  pledges: Array<{
    pledgeId: string;
    reminderType?: ReminderType;
    customDate?: string;
  }>;
}

export interface RescheduleUserPledgeRequest {
  userId: string;
  reminderType?: ReminderType;
  customDate?: string;
}
