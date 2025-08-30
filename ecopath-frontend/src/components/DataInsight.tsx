'use client';

import { useState, useEffect } from 'react';
import EnergyMixChart, { EnergyMix } from './EnergyMixChart';

const AUSTRALIAN_STATES = [
  'Victoria (VIC)',
  'New South Wales (NSW)', 
  'Queensland (QLD)', 
  'Western Australia (WA)',
  'South Australia (SA)', 
  'Tasmania (TAS)', 
  'Australian Capital Territory (ACT)', 
  'Northern Territory (NT)'
];

// Mock data for different states - in real app this would come from API
const STATE_ENERGY_DATA: Record<string, EnergyMix[]> = {
  'Victoria (VIC)': [
    { source: 'Coal', percentage: 45.2, generation: '8,450 MW', trend: -8.5 },
    { source: 'Natural Gas', percentage: 18.3, generation: '3,420 MW', trend: -2.1 },
    { source: 'Wind', percentage: 22.8, generation: '4,250 MW', trend: 15.2 },
    { source: 'Solar', percentage: 8.9, generation: '1,660 MW', trend: 28.7 },
    { source: 'Hydro', percentage: 4.8, generation: '895 MW', trend: 1.2 }
  ],
  'New South Wales (NSW)': [
    { source: 'Coal', percentage: 52.1, generation: '12,300 MW', trend: -5.2 },
    { source: 'Natural Gas', percentage: 15.8, generation: '3,750 MW', trend: -1.8 },
    { source: 'Wind', percentage: 18.5, generation: '4,100 MW', trend: 12.5 },
    { source: 'Solar', percentage: 9.2, generation: '2,180 MW', trend: 25.3 },
    { source: 'Hydro', percentage: 4.4, generation: '1,200 MW', trend: 0.8 }
  ],
  'Queensland (QLD)': [
    { source: 'Coal', percentage: 58.7, generation: '15,200 MW', trend: -3.1 },
    { source: 'Natural Gas', percentage: 22.3, generation: '5,800 MW', trend: 2.5 },
    { source: 'Solar', percentage: 12.8, generation: '3,300 MW', trend: 32.1 },
    { source: 'Hydro', percentage: 4.2, generation: '1,100 MW', trend: 0.5 },
    { source: 'Wind', percentage: 2.0, generation: '520 MW', trend: 8.7 }
  ],
  'Western Australia (WA)': [
    { source: 'Natural Gas', percentage: 48.5, generation: '8,900 MW', trend: 1.2 },
    { source: 'Coal', percentage: 25.2, generation: '4,600 MW', trend: -4.8 },
    { source: 'Solar', percentage: 15.8, generation: '2,900 MW', trend: 28.9 },
    { source: 'Wind', percentage: 8.5, generation: '1,560 MW', trend: 18.3 },
    { source: 'Hydro', percentage: 2.0, generation: '370 MW', trend: 0.2 }
  ],
  'South Australia (SA)': [
    { source: 'Wind', percentage: 42.3, generation: '2,800 MW', trend: 22.1 },
    { source: 'Solar', percentage: 28.7, generation: '1,900 MW', trend: 35.2 },
    { source: 'Natural Gas', percentage: 18.5, generation: '1,220 MW', trend: -2.8 },
    { source: 'Battery Storage', percentage: 8.2, generation: '540 MW', trend: 45.6 },
    { source: 'Other', percentage: 2.3, generation: '150 MW', trend: 1.2 }
  ],
  'Tasmania (TAS)': [
    { source: 'Hydro', percentage: 78.5, generation: '2,800 MW', trend: 0.5 },
    { source: 'Wind', percentage: 15.2, generation: '540 MW', trend: 12.8 },
    { source: 'Natural Gas', percentage: 4.8, generation: '170 MW', trend: -1.2 },
    { source: 'Solar', percentage: 1.5, generation: '53 MW', trend: 18.9 }
  ],
  'Australian Capital Territory (ACT)': [
    { source: 'Solar', percentage: 45.2, generation: '320 MW', trend: 28.7 },
    { source: 'Wind', percentage: 38.8, generation: '275 MW', trend: 22.3 },
    { source: 'Natural Gas', percentage: 12.5, generation: '88 MW', trend: -3.2 },
    { source: 'Battery Storage', percentage: 3.5, generation: '25 MW', trend: 52.1 }
  ],
  'Northern Territory (NT)': [
    { source: 'Natural Gas', percentage: 65.8, generation: '1,200 MW', trend: 2.8 },
    { source: 'Solar', percentage: 22.3, generation: '410 MW', trend: 38.5 },
    { source: 'Diesel', percentage: 8.9, generation: '160 MW', trend: -5.2 },
    { source: 'Wind', percentage: 3.0, generation: '55 MW', trend: 15.7 }
  ]
};

interface DataInsightProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export default function DataInsight({ onNext, onPrev }: DataInsightProps) {
  const [selectedState, setSelectedState] = useState('Victoria (VIC)');
  const [energyData, setEnergyData] = useState<EnergyMix[]>(STATE_ENERGY_DATA['Victoria (VIC)']);

  useEffect(() => {
    // Update energy data when state changes
    setEnergyData(STATE_ENERGY_DATA[selectedState] || []);
  }, [selectedState]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
      {/* Page Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-200/50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-green-800 mb-2">Data Insight Hub</h1>
                <p className="text-green-600 text-lg">Comprehensive environmental data analysis for {selectedState.split(' ')[0]}</p>
              </div>
            </div>
            
            {/* Tool Badge */}
            <div className="text-right">
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200 text-sm font-medium">
                <span className="text-lg">🔍</span>
                <span>Analytics Tool</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">State-wide environmental insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Description */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2 text-green-700">
              <span className="text-lg">🌏</span>
              <span>State-wide emissions data</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <span className="text-lg">💨</span>
              <span>Real-time air quality monitoring</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-700">
              <span className="text-lg">⚡</span>
              <span>Energy consumption analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* State Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-green-800">
                  {selectedState} Environmental Data
                </h3>
                <p className="text-green-600">
                  Real-time data from EPA Victoria & AEMO
                </p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>

            {/* State Selector */}
            <div className="mb-6">
              <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select State
              </label>
              <select
                id="state-select"
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full max-w-md p-3 bg-white text-gray-800 rounded-lg border-2 border-green-300 focus:border-green-500 focus:outline-none shadow-sm"
              >
                {AUSTRALIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Energy Mix Chart and Side Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Energy Mix Chart - Left Column */}
              <div className="lg:col-span-2">
                <EnergyMixChart 
                  data={energyData} 
                  title={`${selectedState.split(' ')[0]} Energy Generation Mix`}
                />
              </div>

              {/* Right Column - Side Panels */}
              <div className="space-y-6">
                {/* Renewable Growth */}
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h5 className="font-medium text-green-800 mb-4 flex items-center">
                    <span className="text-lg mr-2">🌱</span>
                    Renewable Growth
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Wind Power</span>
                      <span className="text-green-600 font-medium">+15.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Solar Power</span>
                      <span className="text-green-600 font-medium">+28.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Total Renewables</span>
                      <span className="text-green-600 font-medium">
                        {energyData
                          .filter(item => ['Wind', 'Solar', 'Hydro'].includes(item.source))
                          .reduce((sum, item) => sum + item.percentage, 0)
                          .toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Storage & Grid */}
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h5 className="font-medium text-purple-800 mb-4 flex items-center">
                    <span className="text-lg mr-2">🔋</span>
                    Storage & Grid
                  </h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Battery storage</span>
                      <span className="text-purple-600 font-medium">850 MW</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Pumped hydro</span>
                      <span className="text-purple-600 font-medium">1,500 MW</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Grid stability</span>
                      <span className="text-purple-600 font-medium">99.8% reliability</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {(onNext || onPrev) && (
            <div className="flex justify-between items-center">
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap border border-gray-200"
                >
                  <span>←</span>
                  <span>Previous Step</span>
                </button>
              )}

              <div className="text-center">
                <p className="text-green-600 text-sm mb-2">
                  Explore environmental data for {selectedState.split(' ')[0]}
                </p>
              </div>

              {onNext && (
                <button
                  onClick={onNext}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 cursor-pointer whitespace-nowrap shadow-lg"
                >
                  <span>Next Journey</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
