"use client";

import { useState, useEffect, useRef } from "react";
import { useStateContext } from "@/contexts/StateContext";
import { ApiService, StateData } from "@/services/api";

export default function GlobalStateSelector() {
  const { selectedState, setSelectedState } = useStateContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [states, setStates] = useState<StateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStateChange = (state: string) => {
    console.log("State change requested:", state);
    setSelectedState(state);
    setIsExpanded(false);
    console.log("State changed to:", state);
  };

  // Fetch states from API
  useEffect(() => {
    // Avoid running in non-browser environments (e.g., Node test teardown)
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchStates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const statesData = await ApiService.getStates();
        if (!isMounted) return;
        setStates(statesData);

        // Don't set default state here to avoid SSR hydration issues
        // The StateContext will handle the initial state
      } catch (err) {
        console.error("Error fetching states:", err);
        if (!isMounted) return;
        setError("Failed to load states");
        // Fallback to hardcoded states (only those with energy data)
        setStates([
          { id: "VIC", name: "Victoria", abbreviation: "VIC", displayName: "Victoria (VIC)" },
          {
            id: "NSW",
            name: "New South Wales",
            abbreviation: "NSW",
            displayName: "New South Wales (NSW)",
          },
          { id: "QLD", name: "Queensland", abbreviation: "QLD", displayName: "Queensland (QLD)" },
          {
            id: "WA",
            name: "Western Australia",
            abbreviation: "WA",
            displayName: "Western Australia (WA)",
          },
          {
            id: "SA",
            name: "South Australia",
            abbreviation: "SA",
            displayName: "South Australia (SA)",
          },
          { id: "TAS", name: "Tasmania", abbreviation: "TAS", displayName: "Tasmania (TAS)" },
        ]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStates();

    return () => {
      isMounted = false;
    };
  }, [selectedState, setSelectedState]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log("Click outside detected, target:", event.target);
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        console.log("Closing dropdown due to click outside");
        setIsExpanded(false);
      }
    };

    if (isExpanded && typeof document !== "undefined") {
      console.log("Adding click outside listener");
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      console.log("Removing click outside listener");
      if (typeof document !== "undefined") {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, [isExpanded]);

  return (
    <div className="fixed top-20 right-4 z-50" ref={containerRef}>
      <div className="relative">
        {/* Main State Display Button */}
        <button
          data-testid="state-selector"
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-white/90 backdrop-blur-sm border-2 border-green-300 hover:border-green-500 rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 min-w-[200px]"
        >
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-800 font-medium text-sm truncate">
            {selectedState.split(" ")[0]}
          </span>
          <span className="text-green-600 text-xs">{selectedState.split(" ")[1]}</span>
          <svg
            className={`w-4 h-4 text-green-600 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isExpanded && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-sm border border-green-200 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-green-100 bg-green-50">
              <h3 className="text-sm font-semibold text-green-800">Select State</h3>
              <p className="text-xs text-green-600">Choose your location for environmental data</p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading states...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <p className="text-xs text-gray-500 mt-1">Using fallback data</p>
                </div>
              ) : (
                states.map((state) => (
                  <button
                    key={state.id}
                    data-testid={`state-option-${state.id}`}
                    onClick={() => handleStateChange(state.displayName)}
                    className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors duration-200 ${
                      selectedState === state.displayName
                        ? "bg-green-100 text-green-800 border-r-2 border-green-500"
                        : "text-gray-700 hover:text-green-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{state.name}</span>
                      <span className="text-sm text-gray-500">({state.abbreviation})</span>
                    </div>
                    {selectedState === state.displayName && (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Current selection</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <span>🌏</span>
                <span>Real-time environmental data</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close - using event listener instead of overlay */}
    </div>
  );
}
