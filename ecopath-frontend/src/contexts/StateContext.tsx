"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

const AUSTRALIAN_STATES = [
  "Victoria (VIC)",
  "New South Wales (NSW)",
  "Queensland (QLD)",
  "Western Australia (WA)",
  "South Australia (SA)",
  "Tasmania (TAS)",
];

interface StateContextType {
  selectedState: string;
  setSelectedState: (state: string) => void;
  availableStates: string[];
}

const StateContext = createContext<StateContextType | undefined>(undefined);

interface StateProviderProps {
  children: ReactNode;
  initialState?: string;
}

export function StateProvider({ children, initialState = "Victoria (VIC)" }: StateProviderProps) {
  // Initialize selectedState with default value for SSR consistency
  const [selectedState, setSelectedState] = useState(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    const savedState = localStorage.getItem("selectedState");
    if (savedState && AUSTRALIAN_STATES.includes(savedState)) {
      setSelectedState(savedState);
    }
  }, []);

  // Persist selectedState to localStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("selectedState", selectedState);
    }
  }, [selectedState, isHydrated]);

  const value = {
    selectedState,
    setSelectedState,
    availableStates: AUSTRALIAN_STATES,
  };

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useStateContext() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useStateContext must be used within a StateProvider");
  }
  return context;
}
