"use client";

import { useState, useEffect } from "react";
import EnergyMixChart, { EnergyMix } from "./EnergyMixChart";
import EmissionsChart, { EmissionData } from "./EmissionsChart";
import ClimateTargetSidebar from "./ClimateTargetSidebar";
import PageHeader from "./PageHeader";
import DataSources from "./DataSources";
import { useStateContext } from "@/contexts/StateContext";
import { ApiService } from "@/services/api";

interface DataInsightProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export default function DataInsight({ onNext, onPrev }: DataInsightProps) {
  const { selectedState } = useStateContext();
  const [activeTab, setActiveTab] = useState<"energy" | "emissions">("energy");
  const [energyMixData, setEnergyMixData] = useState<EnergyMix[]>([]);
  const [emissionsData, setEmissionsData] = useState<EmissionData[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch energy mix data from backend API
  const fetchEnergyMixData = async (state: string, retryAttempt = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Extract state code (e.g., "Victoria (VIC)" -> "VIC")
      const stateCode = state.match(/\(([^)]+)\)/)?.[1] || state.split(" ")[0];

      const apiData = await ApiService.getEnergyMix(stateCode);

      // Transform API data to match EnergyMixChart interface
      const transformedData: EnergyMix[] = apiData.map((item) => ({
        source: item.source.charAt(0).toUpperCase() + item.source.slice(1), // Capitalize first letter
        percentage: item.percentage,
        generation: `${item.generation} GWh`,
      }));

      setEnergyMixData(transformedData);
      setRetryCount(0); // Reset retry count on success
    } catch (err: unknown) {
      console.error("Error fetching energy mix data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch energy mix data";

      if (retryAttempt < 3) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryAttempt) * 1000;
        setTimeout(() => {
          fetchEnergyMixData(state, retryAttempt + 1);
        }, delay);
        setRetryCount(retryAttempt + 1);
      } else {
        setError(errorMessage);
        setEnergyMixData([]); // Set empty array to show "no data" state
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch emissions data from backend API
  const fetchEmissionsData = async (state: string, retryAttempt = 0) => {
    try {
      setLoading(true);
      setError(null);

      const stateCode = state.match(/\(([^)]+)\)/)?.[1] || state.split(" ")[0];
      const apiData = await ApiService.getEmissions(stateCode);

      // Transform API data to match EmissionsChart interface
      const transformedData: EmissionData[] = apiData.data.map((item) => ({
        year: item.year,
        value: typeof item.value === "string" ? parseFloat(item.value) : item.value,
      }));

      setEmissionsData(transformedData);
      setRetryCount(0); // Reset retry count on success
    } catch (err: unknown) {
      console.error("Error fetching emissions data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch emissions data";

      if (retryAttempt < 3) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryAttempt) * 1000;
        setTimeout(() => {
          fetchEmissionsData(state, retryAttempt + 1);
        }, delay);
        setRetryCount(retryAttempt + 1);
      } else {
        setError(errorMessage);
        setEmissionsData([]); // Set empty array to show "no data" state
      }
    } finally {
      setLoading(false);
    }
  };

  // Retry function for manual retry
  const handleRetry = () => {
    if (selectedState) {
      setError(null);
      setRetryCount(0);
      fetchEnergyMixData(selectedState);
      fetchEmissionsData(selectedState);
    }
  };

  // Fetch data when state changes
  useEffect(() => {
    if (selectedState) {
      fetchEnergyMixData(selectedState);
      fetchEmissionsData(selectedState);
    }
  }, [selectedState]);

  const tabs = [
    { id: "energy", label: "Energy Mix", icon: "⚡" },
    { id: "emissions", label: "Emissions", icon: "🌱" },
  ];

  return (
    <div
      data-testid="data-insight"
      className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50"
    >
      {/* Page Header */}
      <PageHeader
        title="Data Insight Hub"
        description={`Comprehensive environmental data analysis for ${selectedState.split(" ")[0]}`}
        icon="📊"
        gradientColors="from-green-500 to-blue-500"
        showToolBadge={true}
        toolBadgeText="Analytics Tool"
        toolBadgeDescription="State-wide environmental insights"
      />

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
          {/* State Information Display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-green-800">
                  {selectedState} Environmental Data
                </h3>
                <p className="text-green-600">Real-time data from EPA Victoria & AEMO</p>
                {error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-500">⚠️</span>
                        <span className="text-red-700 text-sm">{error}</span>
                      </div>
                      <button
                        onClick={handleRetry}
                        className="text-red-600 hover:text-red-800 text-sm font-medium underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
                {loading && retryCount > 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-500">🔄</span>
                      <span className="text-yellow-700 text-sm">
                        Retrying... (Attempt {retryCount}/3)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  loading ? "bg-blue-400 animate-pulse" : error ? "bg-red-400" : "bg-green-400"
                }`}
              ></div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    data-testid={tab.id === "emissions" ? "emissions-tab" : "energy-tab"}
                    onClick={() => setActiveTab(tab.id as "energy" | "emissions")}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "energy" && (
              <div>
                {loading && energyMixData.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/6"></div>
                      </div>
                      <div className="mt-6 h-64 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : energyMixData.length > 0 ? (
                  <EnergyMixChart
                    data={energyMixData}
                    title={`${selectedState.split(" ")[0]} Energy Generation Mix`}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">⚡</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Energy Data Available
                    </h3>
                    <p className="text-gray-600">
                      Energy generation data is not available for {selectedState.split(" ")[0]}.
                    </p>
                    {error && (
                      <button
                        onClick={handleRetry}
                        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "emissions" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Emissions Chart - Left Column */}
                <div className="lg:col-span-2">
                  {loading && emissionsData.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ) : emissionsData.length > 0 ? (
                    <EmissionsChart
                      data={emissionsData}
                      title={`${selectedState.split(" ")[0]} Greenhouse Gas Emissions`}
                    />
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                      <div className="text-gray-400 text-6xl mb-4">🌱</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No Emissions Data Available
                      </h3>
                      <p className="text-gray-600">
                        Emissions data is not available for {selectedState.split(" ")[0]}.
                      </p>
                      {error && (
                        <button
                          onClick={handleRetry}
                          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Climate Targets Sidebar - Right Column */}
                <div className="lg:col-span-1">
                  <ClimateTargetSidebar
                    stateName={selectedState}
                    isLoading={loading}
                    error={error}
                    onRetry={handleRetry}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Data Sources Section */}
          <DataSources />

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Previous Step Button */}
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap border border-gray-200"
                >
                  <span>←</span>
                  <span>Previous Step</span>
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-green-600 text-sm mb-2">
                Explore environmental data for {selectedState.split(" ")[0]}
              </p>
            </div>

            {/* Next Step Button */}
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
        </div>
      </main>
    </div>
  );
}
