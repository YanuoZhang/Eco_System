"use client";

import PageHeader from "./PageHeader";
import { useStateContext } from "@/contexts/StateContext";

interface ProgressTrackerProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export default function ProgressTracker({ onNext, onPrev }: ProgressTrackerProps) {
  const { selectedState } = useStateContext();

  return (
    <div
      data-testid="progress-tracker"
      className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50"
    >
      {/* Page Header */}
      <PageHeader
        title="Progress Tracking"
        description={`Monitor your environmental progress in ${selectedState?.split(" ")[0] || "your area"}`}
        icon="📈"
        gradientColors="from-green-500 to-blue-500"
        showToolBadge={true}
        toolBadgeText="Tracking Tool"
        toolBadgeDescription="Personal environmental progress monitoring"
      />

      {/* Feature Description */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2 text-green-700">
              <span className="text-lg">📊</span>
              <span>Monthly progress tracking</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-700">
              <span className="text-lg">🎯</span>
              <span>Goal setting and monitoring</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-700">
              <span className="text-lg">💡</span>
              <span>Personalized improvement suggestions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Coming Soon */}
      <main className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 border border-green-200 shadow-lg text-center">
            {/* Coming Soon Icon */}
            <div className="text-8xl mb-8">🚧</div>

            {/* Coming Soon Title */}
            <h2 className="text-4xl font-bold text-green-800 mb-6">Coming Soon</h2>

            {/* Description */}
            <p className="text-xl text-green-600 mb-8 max-w-2xl mx-auto">
              We&apos;re working hard to bring you an amazing progress tracking experience. This
              feature will help you monitor your environmental journey and celebrate your
              achievements.
            </p>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-green-800 mb-2">Progress Charts</h3>
                <p className="text-sm text-green-600">
                  Visualize your carbon footprint trends over time
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold text-blue-800 mb-2">Goal Setting</h3>
                <p className="text-sm text-blue-600">Set and track your environmental goals</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="font-semibold text-purple-800 mb-2">Achievements</h3>
                <p className="text-sm text-purple-600">Celebrate your environmental milestones</p>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <span className="text-lg">⏳</span>
                <span className="font-medium">Expected launch: Q2 2024</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
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
                Track your environmental progress in {selectedState?.split(" ")[0] || "your area"}
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
