"use client";

import { useState, useEffect } from "react";
import { ApiService, ClimateTargetData } from "@/services/api";

export interface ClimateTarget {
  planName: string;
  progress: number;
  targetYear: number;
  description?: string;
}

interface ClimateTargetSidebarProps {
  stateName: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Mock climate targets data for different states
const MOCK_CLIMATE_TARGETS: Record<string, ClimateTarget> = {
  "Victoria (VIC)": {
    planName: "Victoria 2030 Net Zero Plan",
    progress: 18,
    targetYear: 2030,
    description: "Ambitious plan to achieve net zero emissions by 2030",
  },
  "New South Wales (NSW)": {
    planName: "NSW Net Zero Plan Stage 1",
    progress: 12,
    targetYear: 2050,
    description: "Comprehensive plan to reach net zero by 2050",
  },
  "Queensland (QLD)": {
    planName: "Queensland Climate Action Plan",
    progress: 8,
    targetYear: 2050,
    description: "Progressive climate action with renewable energy focus",
  },
  "Western Australia (WA)": {
    planName: "WA Climate Policy",
    progress: 15,
    targetYear: 2050,
    description: "Balanced approach to climate action and economic growth",
  },
  "South Australia (SA)": {
    planName: "SA Climate Change Action Plan",
    progress: 22,
    targetYear: 2050,
    description: "Leading renewable energy transition in Australia",
  },
  "Tasmania (TAS)": {
    planName: "Tasmania Climate Action Plan",
    progress: 35,
    targetYear: 2030,
    description: "Already carbon negative, working towards enhanced sustainability",
  },
  "Northern Territory (NT)": {
    planName: "NT Climate Change Response",
    progress: 5,
    targetYear: 2050,
    description: "Developing comprehensive climate action framework",
  },
  "Australian Capital Territory (ACT)": {
    planName: "ACT Climate Change Strategy",
    progress: 28,
    targetYear: 2045,
    description: "Ambitious target to achieve net zero by 2045",
  },
};

export default function ClimateTargetSidebar({
  stateName,
  isLoading = false,
}: ClimateTargetSidebarProps) {
  const [climateTarget, setClimateTarget] = useState<ClimateTargetData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stateName) {
      setIsLoadingData(true);
      setError(null);

      // Extract state code (e.g., "Victoria (VIC)" -> "VIC")
      const stateCode = stateName.match(/\(([^)]+)\)/)?.[1] || stateName.split(" ")[0];

      const fetchClimateTargets = async () => {
        try {
          const data = await ApiService.getClimateTargets(stateCode);
          setClimateTarget(data);
        } catch (err) {
          console.error("Error fetching climate targets data:", err);
          setError("Failed to load climate targets data");
          // Only fallback to mock data for known states
          if (MOCK_CLIMATE_TARGETS[stateName]) {
            const mockTarget = MOCK_CLIMATE_TARGETS[stateName];
            setClimateTarget({
              targetYear: mockTarget.targetYear,
              baselineYear: 2005,
              targetValuePct: 50,
              planName: mockTarget.planName,
              progress: mockTarget.progress,
              progressDescription: `Achieved: ${mockTarget.progress}%`,
              latestEmissions: null,
              notes: mockTarget.description || "",
            });
          } else {
            // For unknown states, set to null to show no data state
            setClimateTarget(null);
          }
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchClimateTargets();
    }
  }, [stateName]);

  // Loading skeleton
  if (isLoading || isLoadingData) {
    return (
      <div
        className="bg-green-50 rounded-lg p-6 border border-green-200 shadow-sm animate-pulse"
        data-testid="loading-skeleton"
      >
        <div className="space-y-4">
          <div className="h-4 bg-green-200 rounded w-3/4"></div>
          <div className="h-6 bg-green-200 rounded w-1/2"></div>
          <div className="h-4 bg-green-200 rounded w-full"></div>
          <div className="h-4 bg-green-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // No data state
  if (!climateTarget) {
    return (
      <div className="bg-green-50 rounded-lg p-6 border border-green-200 shadow-sm">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-green-800 mb-2">No Climate Data</h3>
          <p className="text-green-600">
            Climate target information is not available for this state.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="climate-sidebar"
      className="space-y-6"
      aria-label="Climate Action Plan Information"
    >
      {/* Reduction Goals Card - Green Theme */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200 shadow-sm">
        <div className="space-y-4">
          {/* Plan Name */}
          <div className="text-center pb-2 border-b border-green-200">
            <h4 data-testid="plan-name" className="text-lg font-semibold text-green-800">
              {climateTarget.planName}
            </h4>
          </div>

          {/* Header */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏆</span>
            <h3 className="text-lg font-semibold text-green-800">Reduction Goals</h3>
          </div>

          {/* Target */}
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">{climateTarget.targetYear} Target</span>
            <span className="text-green-600 font-semibold">-{climateTarget.targetValuePct}%</span>
          </div>

          {/* Current Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-green-800 font-medium">Current Progress</span>
              <span data-testid="progress-text" className="text-green-600 font-semibold">
                {climateTarget.progressDescription}
              </span>
            </div>

            {/* Progress Bar */}
            <div
              className="w-full bg-gray-200 rounded-full h-3"
              role="progressbar"
              data-testid="progress-bar"
            >
              <div
                className="h-3 rounded-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${Math.min((climateTarget.progress / climateTarget.targetValuePct) * 100, 100)}%`,
                }}
                aria-valuenow={climateTarget.progress}
                aria-valuemin={0}
                aria-valuemax={climateTarget.targetValuePct}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Initiatives Card - Blue Theme */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 shadow-sm">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💡</span>
            <h3 className="text-lg font-semibold text-blue-800">Key Initiatives</h3>
          </div>

          {/* Initiatives List */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full"
                data-testid="initiative-bullet"
              ></div>
              <span className="text-blue-700">Renewable energy expansion</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full"
                data-testid="initiative-bullet"
              ></div>
              <span className="text-blue-700">Electric vehicle rollout</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full"
                data-testid="initiative-bullet"
              ></div>
              <span className="text-blue-700">Energy efficiency programs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Year Display */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 shadow-sm">
        <div className="text-center">
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-yellow-800 font-semibold" data-testid="target-year">
            Target: {climateTarget.targetYear}
          </div>
          <div className="text-yellow-600 text-sm mt-1">{climateTarget.notes}</div>
        </div>
      </div>
    </div>
  );
}
