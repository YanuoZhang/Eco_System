"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import {
  InfoHero,
  InfoTabNavigation,
  EmissionsSection,
  EnergyMixSection,
  ClimateTargetsSection,
  InfoCallToAction,
  InfoFooter,
  LoadingSpinner,
  EmissionsData,
  EnergyMixData,
  ClimateTarget,
  State,
} from "@/components/info";

export default function InfoPage() {
  const [activeTab, setActiveTab] = useState("emissions");
  const [selectedState, setSelectedState] = useState("VIC");
  const [emissionsData, setEmissionsData] = useState<EmissionsData | null>(null);
  const [energyMixData, setEnergyMixData] = useState<EnergyMixData[]>([]);
  const [climateTarget, setClimateTarget] = useState<ClimateTarget | null>(null);
  const [loading, setLoading] = useState(false);

  // Only show states with complete data (emissions, energy mix, and climate targets)
  // ACT and NT are excluded due to missing energy generation data
  const states: State[] = [
    { id: "NSW", name: "New South Wales" },
    { id: "VIC", name: "Victoria" },
    { id: "QLD", name: "Queensland" },
    { id: "SA", name: "South Australia" },
    { id: "WA", name: "Western Australia" },
    { id: "TAS", name: "Tasmania" },
  ];

  const selectedStateName = states.find((s) => s.id === selectedState)?.name || selectedState;

  const fetchEmissionsData = async (state: string) => {
    try {
      const data = await apiClient.getEmissionsData(state, "10y");
      setEmissionsData(data);
    } catch (error) {
      // Set null for errors - component will handle display
      setEmissionsData(null);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("404")) {
        console.error("Error fetching emissions data:", error);
      }
    }
  };

  const fetchEnergyMixData = async (state: string) => {
    try {
      const data = await apiClient.getEnergyMixData(state);
      setEnergyMixData(data);
    } catch (error) {
      // Set empty array for 404 or other errors - component will show "no data available"
      setEnergyMixData([]);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("404")) {
        console.error("Error fetching energy mix data:", error);
      }
    }
  };

  const fetchClimateTarget = async (state: string) => {
    try {
      const data = await apiClient.getClimateTargets(state);
      setClimateTarget(data);
    } catch (error) {
      // Set null for errors - component will handle display
      setClimateTarget(null);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("404")) {
        console.error("Error fetching climate target:", error);
      }
    }
  };

  useEffect(() => {
    const loadData = async (state: string) => {
      setLoading(true);
      try {
        await Promise.all([
          fetchEmissionsData(state),
          fetchEnergyMixData(state),
          fetchClimateTarget(state),
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        // Only update state if we're in a browser environment
        if (typeof window !== "undefined") {
          setLoading(false);
        }
      }
    };

    loadData(selectedState);
  }, [selectedState]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-700 via-indigo-600 via-blue-600 via-teal-600 to-emerald-600">
      <InfoHero selectedState={selectedState} states={states} onStateChange={setSelectedState} />

      <InfoTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content Sections */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {loading && <LoadingSpinner />}

          {activeTab === "emissions" && !loading && (
            <EmissionsSection
              emissionsData={emissionsData}
              selectedState={selectedState}
              stateName={selectedStateName}
            />
          )}

          {activeTab === "energy" && !loading && (
            <EnergyMixSection
              energyMixData={energyMixData}
              selectedState={selectedState}
              stateName={selectedStateName}
            />
          )}

          {activeTab === "targets" && !loading && (
            <ClimateTargetsSection
              climateTarget={climateTarget}
              selectedState={selectedState}
              stateName={selectedStateName}
            />
          )}
        </div>
      </section>

      <InfoCallToAction />

      <InfoFooter />

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
