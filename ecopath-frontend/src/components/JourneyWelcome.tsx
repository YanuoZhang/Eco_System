'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

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
    <section className="py-8 sm:py-16 px-4 bg-gradient-to-b from-white to-green-50">
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
            🚀 Follow our illustrated journey path to explore environmental data around you, calculate your carbon footprint, and discover ways to help the planet
          </p>
        </div>

        {/* Journey Preview */}
        <div className="mb-12 sm:mb-16">
          <h3 className="text-xl sm:text-2xl font-semibold text-green-800 mb-6 sm:mb-8 px-2">Your Journey Path Preview</h3>
          
          <div className="relative max-w-6xl mx-auto">
            {/* Desktop Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-200 via-blue-200 via-yellow-200 to-emerald-200 transform -translate-y-1/2 rounded-full"></div>
            
            {/* Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 relative z-10 px-2">
              {[
                { 
                  icon: '🌱', 
                  title: 'Welcome to Journey', 
                  color: 'emerald', 
                  bg: 'from-emerald-100 to-green-200',
                  description: 'Start exploring',
                  number: 1
                },
                { 
                  icon: '🌍', 
                  title: 'Explore Environment', 
                  color: 'blue', 
                  bg: 'from-blue-100 to-cyan-200',
                  description: 'Discover data',
                  number: 2
                },
                { 
                  icon: '🔍', 
                  title: 'Calculate Footprint', 
                  color: 'purple', 
                  bg: 'from-purple-100 to-indigo-200',
                  description: 'Measure impact',
                  number: 3
                },
                { 
                  icon: '📈', 
                  title: 'Track Progress', 
                  color: 'teal', 
                  bg: 'from-teal-100 to-emerald-200',
                  description: 'Monitor growth',
                  number: 4
                },
                { 
                  icon: '🏆', 
                  title: 'Plan Future Actions', 
                  color: 'yellow', 
                  bg: 'from-yellow-100 to-amber-200',
                  description: 'Create roadmap',
                  number: 5
                }
              ].map((step, index) => (
                <div key={index} className={`relative bg-gradient-to-br ${step.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-${step.color}-200 shadow-lg transform hover:scale-105 transition-all duration-300`}>
                  {/* Mobile Connection Arrow */}
                  {index < 4 && (
                    <div className="sm:hidden absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="w-px h-3 bg-gradient-to-b from-gray-300 to-transparent"></div>
                      <div className="w-0 h-0 border-l-2 border-r-2 border-t-3 border-l-transparent border-r-transparent border-t-gray-300 mx-auto"></div>
                    </div>
                  )}
                  
                  {/* Desktop Connection Line */}
                  {index < 4 && (
                    <div className="hidden sm:block lg:hidden absolute -right-2 top-1/2 w-4 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2 lg:mb-3">{step.icon}</div>
                    <h4 className={`font-bold text-${step.color}-800 text-xs sm:text-sm mb-1`}>{step.title}</h4>
                    <p className={`text-xs text-${step.color}-700 opacity-80`}>{step.description}</p>
                  </div>
                  
                  {/* Step Number Badge */}
                  <div className={`absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-${step.color}-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md`}>
                    {step.number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Journey Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 px-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">👁️</div>
            <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2 sm:mb-3">Real-time Environmental Insights</h3>
            <p className="text-green-600 text-sm leading-relaxed">Get air quality, temperature and carbon emission data for your area, discover environmental secrets like an explorer</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🎯</div>
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2 sm:mb-3">Personal Footprint Calculator</h3>
            <p className="text-blue-600 text-sm leading-relaxed">Track your carbon emissions like a detective, compare with national averages, and find areas for improvement</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🚀</div>
            <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2 sm:mb-3">Progress Tracking System</h3>
            <p className="text-yellow-700 text-sm leading-relaxed">Get personalized environmental tips, track your monthly improvements, and witness your green journey</p>
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

        {/* Achievement Showcase */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-8 mt-12 sm:mt-16 p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-green-200 mx-2">
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 flex items-center justify-center space-x-1">
              <span>🌟</span>
              <span>100k+</span>
            </div>
            <div className="text-xs text-green-500 mt-1">Explorers</div>
          </div>
          <div className="hidden sm:block w-px h-8 sm:h-12 bg-green-300"></div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 flex items-center justify-center space-x-1">
              <span>🌱</span>
              <span>25k tonnes</span>
            </div>
            <div className="text-xs text-blue-500 mt-1">CO₂ reduced</div>
          </div>
          <div className="hidden sm:block w-px h-8 sm:h-12 bg-green-300"></div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 flex items-center justify-center space-x-1">
              <span>💚</span>
              <span>98%</span>
            </div>
            <div className="text-xs text-yellow-600 mt-1">Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}
