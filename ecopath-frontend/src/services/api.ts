const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";
console.log("BASE URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
console.log("API URL:", API_BASE_URL);
export interface EnergyMixData {
  source: string;
  percentage: number;
  generation: number;
}

export interface EmissionsData {
  unit: string;
  latest: {
    year: number;
    value: number;
  } | null;
  data: Array<{
    year: number;
    value: number;
  }>;
}

export interface ClimateTargetData {
  targetYear: number;
  baselineYear: number;
  targetValuePct: number;
  planName: string;
  progress: number;
  progressDescription: string;
  latestEmissions: {
    year: number;
    value: number;
  } | null;
  notes: string;
}

export interface StateData {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
}

export class ApiService {
  static async getEnergyMix(state: string): Promise<EnergyMixData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/energy-mix?state=${state}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching energy mix data:", error);
      throw error;
    }
  }

  static async getEmissions(state: string, range: string = "all"): Promise<EmissionsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emissions?state=${state}&range=${range}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching emissions data:", error);
      throw error;
    }
  }

  static async getEnvironment(): Promise<{ env: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/environment`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching environment data:", error);
      throw error;
    }
  }

  static async getClimateTargets(state: string): Promise<ClimateTargetData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/climate-targets?state=${state}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching climate targets data:", error);
      throw error;
    }
  }

  static async getStates(): Promise<StateData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/states`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching states data:", error);
      throw error;
    }
  }

  // Emissions Calculator APIs
  static async getEmissionsFactors(state: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emissions/factors?state=${state}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching emissions factors:", error);
      throw error;
    }
  }

  static async getSupportedUnits() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emissions/supported-units`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching supported units:", error);
      throw error;
    }
  }

  static async calculateEmissions(payload: {
    state: string;
    energy?: { electricity?: number; gas?: number; timeUnit: "month" | "quarter" | "year" };
    transport?: {
      mode: "car" | "bus" | "train" | "tram" | "bicycle" | "walking";
      distance: number;
      timeUnit: "day" | "week" | "month" | "year";
      frequency?: number;
    };
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emissions/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`HTTP error! status: ${response.status} ${errText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error calculating emissions:", error);
      throw error;
    }
  }
}
