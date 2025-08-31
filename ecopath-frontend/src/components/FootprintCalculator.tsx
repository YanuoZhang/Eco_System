"use client";

import { useStateContext } from "@/contexts/StateContext";
import PageHeader from "./PageHeader";

interface FootprintCalculatorProps {
  onPrev?: () => void;
  onBackToHomepage?: () => void;
}

export default function FootprintCalculator({
  onPrev,
  onBackToHomepage,
}: FootprintCalculatorProps) {
  const { selectedState } = useStateContext();

  return (
    <div
      data-testid="footprint-calculator"
      className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50"
    >
      {/* Page Header */}
      <PageHeader
        title="Footprint Calculator"
        description={`Calculate your environmental impact for ${selectedState.split(" ")[0]}`}
        icon="🧮"
        gradientColors="from-green-500 to-blue-500"
        onBackToHomepage={onBackToHomepage}
        showToolBadge={true}
        toolBadgeText="Impact Tool"
        toolBadgeDescription="Personal carbon footprint"
      />

      {/* Main Content - Under Development Status */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            {/* Development Status Icon and Text */}
            <div className="mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-6xl">🚧</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Under Development</h2>
              <p className="text-xl text-gray-600 mb-2">
                Footprint Calculator feature is currently under development
              </p>
              <p className="text-lg text-gray-500">
                We&apos;re working hard to build you a powerful carbon footprint calculator for{" "}
                {selectedState.split(" ")[0]}
              </p>
            </div>

            {/* Upcoming Features Preview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-green-200 shadow-lg max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold text-green-800 mb-6">Coming Soon Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-2xl">🚗</span>
                  <span className="text-green-700">Transportation Carbon Footprint</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">⚡</span>
                  <span className="text-blue-700">Energy Consumption Analysis</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-2xl">🗑️</span>
                  <span className="text-purple-700">Waste Management Impact</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <span className="text-2xl">🍽️</span>
                  <span className="text-orange-700">Dietary Habit Assessment</span>
                </div>
              </div>
            </div>

            {/* Estimated Completion Time */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">Estimated Completion</p>
              <div className="inline-flex items-center space-x-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full border border-yellow-200">
                <span className="text-lg">⏰</span>
                <span className="font-medium">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {onPrev && (
            <div className="flex justify-center mt-12">
              <button
                onClick={onPrev}
                className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap border border-gray-200"
              >
                <span>←</span>
                <span>Previous Step</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
