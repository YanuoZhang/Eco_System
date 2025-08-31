"use client";

import { useState, useCallback } from "react";

export type JourneyStep = 1 | 2 | 3 | 4 | 5;

export interface JourneyState {
  currentStep: JourneyStep;
  isStarted: boolean;
}

export const useJourney = () => {
  const [journeyState, setJourneyState] = useState<JourneyState>({
    currentStep: 1,
    isStarted: false,
  });

  const startJourney = useCallback(() => {
    setJourneyState((prev) => ({
      ...prev,
      isStarted: true,
      currentStep: 1,
    }));
  }, []);

  const goToStep = useCallback((step: JourneyStep) => {
    setJourneyState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setJourneyState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 5) as JourneyStep,
    }));
  }, []);

  const previousStep = useCallback(() => {
    setJourneyState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1) as JourneyStep,
    }));
  }, []);

  const resetJourney = useCallback(() => {
    setJourneyState({
      currentStep: 1,
      isStarted: false,
    });
  }, []);

  return {
    ...journeyState,
    startJourney,
    goToStep,
    nextStep,
    previousStep,
    resetJourney,
  };
};
