const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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
      console.error('Error fetching energy mix data:', error);
      throw error;
    }
  }

  static async getEmissions(state: string, range: string = 'all'): Promise<EmissionsData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/emissions?state=${state}&range=${range}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching emissions data:', error);
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
      console.error('Error fetching environment data:', error);
      throw error;
    }
  }
}
