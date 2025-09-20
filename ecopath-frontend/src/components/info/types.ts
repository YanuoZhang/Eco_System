export interface EmissionsData {
  unit: string;
  latest: { year: number; value: string | number } | null;
  data: { year: number; value: string | number }[];
}

export interface EnergyMixData {
  source: string;
  percentage: number;
  generation: string | number;
}

export interface ClimateTarget {
  targetYear: number;
  baselineYear: number;
  targetValuePct: number;
  planName: string;
  progress: string | number;
  progressDescription: string;
  latestEmissions: { year: number; value: string | number } | null;
  notes: string;
}

export interface State {
  id: string;
  name: string;
}
