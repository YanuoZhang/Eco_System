"use client";

import React, { useState } from "react";
import { ApiService, EnergyMixData, EmissionsData } from "@/services/api";

export default function ApiTestPage() {
  const [energyMixData, setEnergyMixData] = useState<EnergyMixData[]>([]);
  const [emissionsData, setEmissionsData] = useState<EmissionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState("VIC");

  const states = ["VIC", "NSW", "QLD", "SA", "TAS", "WA"];

  const testEnergyMix = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getEnergyMix(selectedState);
      setEnergyMixData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testEmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getEmissions(selectedState);
      setEmissionsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testEnvironment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getEnvironment();
      console.log("Environment data:", data);
      alert(`Environment: ${data.env}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Connection Test</h1>

        {/* State Selector */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Select State</h2>
          <div className="flex flex-wrap gap-2">
            {states.map((state) => (
              <button
                key={state}
                onClick={() => setSelectedState(state)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedState === state
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Test API Endpoints</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testEnergyMix}
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Test Energy Mix API
            </button>
            <button
              onClick={testEmissions}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Test Emissions API
            </button>
            <button
              onClick={testEnvironment}
              disabled={loading}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              Test Environment API
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-blue-700">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <span className="text-red-700">Error: {error}</span>
          </div>
        )}

        {/* Energy Mix Results */}
        {energyMixData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Energy Mix Data for {selectedState}</h2>
            <div className="space-y-3">
              {energyMixData.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{item.source}</span>
                  <span className="text-blue-600">{item.percentage}%</span>
                  <span className="text-gray-600">{item.generation} MW</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emissions Results */}
        {emissionsData && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Emissions Data for {selectedState}</h2>
            <div className="mb-4">
              <p className="text-gray-600">Unit: {emissionsData.unit}</p>
              {emissionsData.latest && (
                <p className="text-gray-600">
                  Latest: {emissionsData.latest.year} - {emissionsData.latest.value}{" "}
                  {emissionsData.unit}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {emissionsData.data.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <span className="font-medium">{item.year}</span>
                  <span className="text-red-600">
                    {item.value} {emissionsData.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
