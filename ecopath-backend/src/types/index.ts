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
