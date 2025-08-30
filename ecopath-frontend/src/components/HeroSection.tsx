'use client';

import { Button } from '@/components/Button';

interface HeroSectionProps {
  onStartJourney: () => void;
}

export default function HeroSection({ onStartJourney }: HeroSectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-green-200 shadow-sm mb-6">
          <span className="text-emerald-400 text-sm font-medium">Smart Environmental Journey Tracking System</span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl font-bold text-green-800 mb-6">
          Discover Your
          <br />
          <span className="bg-gradient-to-r from-green-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Environmental Path
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl sm:text-2xl text-green-700 mb-8 max-w-3xl mx-auto leading-relaxed">
          Through personalized environmental journeys, understand local environmental data, calculate carbon footprints, track progress and develop sustainable development plans.
        </p>

        {/* CTA Button */}
        <button
          onClick={onStartJourney}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Start Environmental Journey
        </button>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-green-200">
            <div className="text-3xl mb-3">🌱</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Personalized Journey</h3>
            <p className="text-green-600 text-sm">Tailored environmental exploration based on your location and interests</p>
          </div>
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-green-200">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Data Insights</h3>
            <p className="text-green-600 text-sm">Real-time environmental data and sustainability metrics</p>
          </div>
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-green-200">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">Action Planning</h3>
            <p className="text-green-600 text-sm">Practical steps to reduce your environmental impact</p>
          </div>
        </div>
      </div>
    </div>
  );
}
