"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

const AUSTRALIAN_STATES = [
  "Victoria (VIC)",
  "New South Wales (NSW)",
  "Queensland (QLD)",
  "Western Australia (WA)",
  "South Australia (SA)",
  "Tasmania (TAS)",
  "Australian Capital Territory (ACT)",
  "Northern Territory (NT)",
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
  // Initialize selectedState from localStorage or default
  const [selectedState, setSelectedState] = useState(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("selectedState");
      if (savedState && AUSTRALIAN_STATES.includes(savedState)) {
        return savedState;
      }
    }
    return initialState;
  });

  // Persist selectedState to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedState", selectedState);
    }
  }, [selectedState]);

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
