'use client';

import { useState } from 'react';
import HeroSection from '@/components/HeroSection';
import JourneyWelcome from '@/components/JourneyWelcome';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { 
      id: 1, 
      title: 'Welcome to Your Journey', 
      icon: '🌱',
      description: 'Start your environmental exploration'
    },
    { 
      id: 2, 
      title: 'Discover Your Environment', 
      icon: '🌍',
      description: 'Explore local environmental data'
    }
  ];

  const nextStep = () => {
   
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <JourneyWelcome onNext={nextStep} />;
      case 2:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-green-800 mb-4">
                🌍 Environmental Data Insights
              </h1>
              <p className="text-xl text-green-700 mb-8 max-w-3xl mx-auto">
                Explore environmental data around you, understand air quality, carbon emissions and sustainable development opportunities
              </p>
              <div className="space-x-4">
                <button
                  onClick={prevStep}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                  ← Previous Step
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Show Hero if no step is selected
  if (currentStep === 0) {
    return <HeroSection onStartJourney={() => setCurrentStep(1)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
      {/* Stepper Zone */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-200/50 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Your Environmental Journey</h1>
            <p className="text-green-600 text-sm sm:text-base">Follow the path to discover sustainable living</p>
          </div>

          {/* Journey Steps */}
          <div className="flex flex-col md:flex-row md:justify-center md:items-center relative z-10 space-y-6 md:space-y-0 md:space-x-12">
            {steps.map((step, index) => {
              const isCurrent = index + 1 === currentStep;
              const isCompleted = index + 1 < currentStep;

              return (
                <div key={step.id} className="flex md:flex-col items-center md:text-center">
                  {/* Step Icon */}
                  <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-500 transform ${
                    isCurrent 
                      ? 'bg-gradient-to-br from-green-400 to-blue-400 border-white shadow-lg scale-110 animate-pulse' 
                      : isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-emerald-200 shadow-md' 
                        : 'bg-gray-100 border-gray-300'
                  }`}>
                    <span className={`text-3xl ${
                      isCurrent ? 'text-white' : 
                      isCompleted ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.icon}
                    </span>

                    {/* Completion Mark */}
                    {isCompleted && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    )}

                    {/* Current Step Glow */}
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-blue-400 opacity-30 animate-ping"></div>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="text-center mt-4 max-w-32 ml-4 md:ml-0">
                    <h3 className={`font-semibold text-sm mb-1 ${
                      isCurrent ? 'text-green-700' : 
                      isCompleted ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs leading-tight ${
                      isCurrent ? 'text-green-600' : 
                      isCompleted ? 'text-emerald-500' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Step Status */}
          <div className="text-center mt-6 sm:mt-8">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-green-200 shadow-sm">
              <span className="text-xl sm:text-2xl">{steps[currentStep - 1]?.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-green-800 text-xs sm:text-sm">Step {currentStep}</div>
                <div className="text-green-600 text-xs">{steps[currentStep - 1]?.title}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Content */}
      <main className="min-h-[calc(100vh-300px)]">
        {renderCurrentStep()}
      </main>
    </div>
  );
}
