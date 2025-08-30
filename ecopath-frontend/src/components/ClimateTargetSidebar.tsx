'use client';

import { useState, useEffect } from 'react';

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
  'Victoria': {
    planName: 'Victoria 2030 Net Zero Plan',
    progress: 18,
    targetYear: 2030,
    description: 'Ambitious plan to achieve net zero emissions by 2030'
  },
  'New South Wales': {
    planName: 'NSW Net Zero Plan Stage 1',
    progress: 12,
    targetYear: 2050,
    description: 'Comprehensive plan to reach net zero by 2050'
  },
  'Queensland': {
    planName: 'Queensland Climate Action Plan',
    progress: 8,
    targetYear: 2050,
    description: 'Progressive climate action with renewable energy focus'
  },
  'Western Australia': {
    planName: 'WA Climate Policy',
    progress: 15,
    targetYear: 2050,
    description: 'Balanced approach to climate action and economic growth'
  },
  'South Australia': {
    planName: 'SA Climate Change Action Plan',
    progress: 22,
    targetYear: 2050,
    description: 'Leading renewable energy transition in Australia'
  },
  'Tasmania': {
    planName: 'Tasmania Climate Action Plan',
    progress: 35,
    targetYear: 2030,
    description: 'Already carbon negative, working towards enhanced sustainability'
  },
  'Northern Territory': {
    planName: 'NT Climate Change Response',
    progress: 5,
    targetYear: 2050,
    description: 'Developing comprehensive climate action framework'
  },
  'Australian Capital Territory': {
    planName: 'ACT Climate Change Strategy',
    progress: 28,
    targetYear: 2045,
    description: 'Ambitious target to achieve net zero by 2045'
  }
};

export default function ClimateTargetSidebar({ 
  stateName, 
  isLoading = false, 
  error = null, 
  onRetry 
}: ClimateTargetSidebarProps) {
  const [climateTarget, setClimateTarget] = useState<ClimateTarget | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (stateName) {
      setIsLoadingData(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        const target = MOCK_CLIMATE_TARGETS[stateName] || MOCK_CLIMATE_TARGETS['Victoria'];
        setClimateTarget(target);
        setIsLoadingData(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [stateName]);

  // Loading skeleton
  if (isLoading || isLoadingData) {
    return (
      <div className="bg-green-50 rounded-lg p-6 border border-green-200 shadow-sm animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-green-200 rounded w-3/4"></div>
          <div className="h-6 bg-green-200 rounded w-1/2"></div>
          <div className="h-4 bg-green-200 rounded w-full"></div>
          <div className="h-4 bg-green-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200 shadow-sm">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          )}
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
          <p className="text-green-600">Climate target information is not available for this state.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reduction Goals Card - Green Theme */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200 shadow-sm">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏆</span>
            <h3 className="text-lg font-semibold text-green-800">Reduction Goals</h3>
          </div>

          {/* 2030 Target */}
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">2030 Target</span>
            <span className="text-green-600 font-semibold">-45%</span>
          </div>

          {/* Current Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-green-800 font-medium">Current Progress</span>
              <span className="text-green-600 font-semibold">-{climateTarget.progress}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="h-3 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min(climateTarget.progress, 100)}%` }}
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
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700">Renewable energy expansion</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700">Electric vehicle rollout</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700">Energy efficiency programs</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
