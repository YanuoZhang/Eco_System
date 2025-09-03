"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

interface JourneyWelcomeProps {
  onNext: () => void;
}

export default function JourneyWelcome({ onNext }: JourneyWelcomeProps) {
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    setTimeout(() => {
      onNext();
    }, 1500);
  };

  return (
    <section
      data-testid="journey-welcome"
      className="py-8 sm:py-16 px-4 bg-gradient-to-b from-white to-green-50"
    >
      <div className="max-w-5xl mx-auto text-center">
        {/* Hero Animation */}
        <div className="mb-12 sm:mb-16">
          <div className="relative inline-block mb-6 sm:mb-8">
            {/* Main Earth Icon */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-green-400 via-blue-400 to-teal-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
              <span className="text-4xl sm:text-6xl">🌍</span>
            </div>

            {/* Orbiting Small Icons */}
            <div className="absolute -top-3 -right-4 sm:-top-6 sm:-right-8 w-8 h-8 sm:w-12 sm:h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-lg sm:text-2xl">🌞</span>
            </div>
            <div className="absolute -bottom-2 -left-6 sm:-bottom-4 sm:-left-10 w-6 h-6 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-sm sm:text-xl">🌱</span>
            </div>
            <div className="absolute top-4 -left-6 sm:top-8 sm:-left-12 w-6 h-6 sm:w-8 sm:h-8 bg-blue-400 rounded-full flex items-center justify-center shadow-lg animate-ping">
              <span className="text-sm sm:text-lg">💧</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-green-800 mb-4 sm:mb-6 leading-tight px-2">
            Welcome to Your
            <span className="bg-gradient-to-r from-green-500 via-blue-500 to-teal-500 bg-clip-text text-transparent block mt-1 sm:mt-2">
              Environmental Journey
            </span>
          </h1>

          <p className="text-base sm:text-xl text-green-700 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
            🚀 Follow our illustrated journey path to explore environmental data around you,
            calculate your carbon footprint, and discover ways to help the planet
          </p>
        </div>

        {/* Journey Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 px-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">👁️</div>
            <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2 sm:mb-3">
              Real-time Environmental Insights
            </h3>
            <p className="text-green-600 text-sm leading-relaxed">
              Get air quality, temperature and carbon emission data for your area, discover
              environmental secrets like an explorer
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎯</div>
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2 sm:mb-3">
              Personal Footprint Calculator
            </h3>
            <p className="text-blue-600 text-sm leading-relaxed">
              Track your carbon emissions like a detective, compare with national averages, and find
              areas for improvement
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🚀</div>
            <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2 sm:mb-3">
              Progress Tracking System
            </h3>
            <p className="text-yellow-700 text-sm leading-relaxed">
              Get personalized environmental tips, track your monthly improvements, and witness your
              green journey
            </p>
          </div>
        </div>

        {/* Start Journey Button */}
        <div className="space-y-4 sm:space-y-6 px-2">
          <Button
            onClick={handleStart}
            disabled={isStarting}
            className="group bg-gradient-to-r from-green-500 via-blue-500 to-teal-500 text-white px-6 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-full text-base sm:text-lg lg:text-xl font-bold hover:from-green-600 hover:via-blue-600 hover:to-teal-600 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none w-full sm:w-auto"
          >
            {isStarting ? (
              <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                <span className="animate-spin">⏳</span>
                <span>Starting...</span>
                <span className="text-lg sm:text-xl">✨</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                <span className="text-lg sm:text-xl group-hover:animate-bounce">🚀</span>
                <span>Start My Environmental Journey</span>
                <span className="text-lg sm:text-xl group-hover:animate-pulse">🌟</span>
              </span>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-green-600">
            <div className="flex items-center space-x-1">
              <span className="text-base sm:text-lg">⏱️</span>
              <span>Only 5 minutes</span>
            </div>
            <div className="hidden sm:block w-1 h-4 bg-green-300"></div>
            <div className="flex items-center space-x-1">
              <span className="text-base sm:text-lg">🆓</span>
              <span>Completely free</span>
            </div>
            <div className="hidden sm:block w-1 h-4 bg-green-300"></div>
            <div className="flex items-center space-x-1">
              <span className="text-base sm:text-lg">🔒</span>
              <span>Privacy protected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
