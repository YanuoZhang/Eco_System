"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeroSection from "@/components/HeroSection";
import JourneyWelcome from "@/components/JourneyWelcome";
import DataInsight from "@/components/DataInsight";
import ProgressTracker from "@/components/ProgressTracker";
import GlobalStateSelector from "@/components/GlobalStateSelector";
import CarbonFootprintCalculator from "@/components/CarbonFootprintCalculator";
import { StateProvider } from "@/contexts/StateContext";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Initialize currentStep with default value for SSR consistency
  const [currentStep, setCurrentStep] = useState(1);

  // Handle hydration and load from localStorage
  useEffect(() => {
    setMounted(true);
    const savedStep = localStorage.getItem("currentStep");
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }
  }, []);

  const steps = [
    {
      id: 1,
      title: "Welcome to Your Journey",
      icon: "🌱",
      description: "Start your environmental exploration",
    },
    {
      id: 2,
      title: "Discover Your Environment",
      icon: "🌍",
      description: "Explore local environmental data",
    },
    {
      id: 3,
      title: "Calculate Your Footprint",
      icon: "🧮",
      description: "Measure your environmental impact",
    },
    {
      id: 4,
      title: "Track Your Progress",
      icon: "📈",
      description: "Monitor improvements over time",
    },
  ];

  // Sync URL with current step
  useEffect(() => {
    const stepFromUrl = searchParams.get("step");
    if (stepFromUrl) {
      const stepNumber = parseInt(stepFromUrl);
      if (stepNumber >= 1 && stepNumber <= steps.length) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams, steps.length]);

  // Update URL when step changes
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("step", currentStep.toString());
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
  }, [currentStep, router]);

  // Persist currentStep to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentStep", currentStep.toString());
    }
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
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
        return <DataInsight onNext={() => setCurrentStep(3)} onPrev={prevStep} />;
      case 3:
        return <CarbonFootprintCalculator onNext={() => setCurrentStep(4)} onPrev={prevStep} />;
      case 4:
        return <ProgressTracker onNext={() => setCurrentStep(1)} onPrev={prevStep} />;
      default:
        return null;
    }
  };

  // Show Hero if no step is selected
  if (currentStep === 0) {
    return (
      <StateProvider>
        <HeroSection onStartJourney={() => setCurrentStep(1)} />
        <GlobalStateSelector />
      </StateProvider>
    );
  }

  return (
    <StateProvider>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50">
        {/* Global State Selector */}
        <GlobalStateSelector />

        {/* Stepper Zone */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-green-200/50 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">
                Your Environmental Journey
              </h1>
              <p className="text-green-600 text-sm sm:text-base">
                Follow the path to discover sustainable living
              </p>
            </div>

            {/* Journey Steps */}
            <div className="flex flex-col md:flex-row md:justify-center md:items-center relative z-10 space-y-6 md:space-y-0 md:space-x-12">
              {!mounted
                ? // Show loading state during hydration
                  steps.map((step) => (
                    <div key={step.id} className="flex md:flex-col items-center md:text-center">
                      <div className="relative w-20 h-20 rounded-full flex items-center justify-center border-4 bg-gray-100 border-gray-300">
                        <span className="text-3xl text-gray-400">{step.icon}</span>
                      </div>
                      <div className="text-center mt-4 max-w-32 ml-4 md:ml-0">
                        <h3 className="font-semibold text-sm mb-1 text-gray-400">{step.title}</h3>
                        <p className="text-xs leading-tight text-gray-400">{step.description}</p>
                      </div>
                    </div>
                  ))
                : steps.map((step, index) => {
                    const isCurrent = index + 1 === currentStep;
                    const isCompleted = index + 1 < currentStep;

                    return (
                      <div key={step.id} className="flex md:flex-col items-center md:text-center">
                        {/* Step Icon */}
                        <div
                          className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-500 transform ${
                            isCurrent
                              ? "bg-gradient-to-br from-green-400 to-blue-400 border-white shadow-lg scale-110 animate-pulse"
                              : isCompleted
                                ? "bg-gradient-to-br from-green-500 to-emerald-500 border-emerald-200 shadow-md"
                                : "bg-gray-100 border-gray-300"
                          }`}
                        >
                          <span
                            className={`text-3xl ${
                              isCurrent
                                ? "text-white"
                                : isCompleted
                                  ? "text-white"
                                  : "text-gray-400"
                            }`}
                          >
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
                          <h3
                            className={`font-semibold text-sm mb-1 ${
                              isCurrent
                                ? "text-green-700"
                                : isCompleted
                                  ? "text-emerald-600"
                                  : "text-gray-400"
                            }`}
                          >
                            {step.title}
                          </h3>
                          <p
                            className={`text-xs leading-tight ${
                              isCurrent
                                ? "text-green-600"
                                : isCompleted
                                  ? "text-emerald-500"
                                  : "text-gray-400"
                            }`}
                          >
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
                  <div className="font-semibold text-green-800 text-xs sm:text-sm">
                    Step {currentStep}
                  </div>
                  <div className="text-green-600 text-xs">{steps[currentStep - 1]?.title}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Content */}
        <main className="min-h-[calc(100vh-300px)]">{renderCurrentStep()}</main>
      </div>
    </StateProvider>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌱</span>
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Loading...</h2>
            <p className="text-green-600">Preparing your environmental journey</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
