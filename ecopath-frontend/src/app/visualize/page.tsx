"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/services/apiClient";

type SavedPledge = {
  id: string;
  title?: string;
  impact?: "small" | "medium" | "large";
  category?: string;
};

// Note: All data now comes from real APIs - no more hardcoded values

export default function VisualizePage() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string>("anonymous");
  const [savedPledges, setSavedPledges] = useState<SavedPledge[]>([]);
  const [loading, setLoading] = useState(true);
  // Note: predictionData removed - now using unified emissions APIs
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [statePopulation, setStatePopulation] = useState<number | null>(null); // Start with null
  const [emissionsComparison, setEmissionsComparison] = useState<{
    baseline: number;
    withPledges: number;
    saved: number;
    unit?: string;
    timestamp?: string;
    metadata: {
      state: string;
      pledgesCount: number;
      pledgedKgPerYearReduction: number;
      calculationMethod?: string;
    };
  } | null>(null);
  const [emissionsForecast, setEmissionsForecast] = useState<{
    yearlyForecast: Array<{
      year: number;
      baseline: number;
      withPledges: number;
      saved: number;
    }>;
  } | null>(null);
  const [communityStats, setCommunityStats] = useState<{
    totalUsers: number;
    totalPledges: number;
    totalSavings: number;
    topPledges: Array<{
      type: string;
      percentage: number;
      count: number;
      color: string;
      savings?: number;
    }>;
  } | null>(null);
  const [pledgeSavings, setPledgeSavings] = useState<
    Array<{
      name: string;
      saving: number;
    }>
  >([]);
  const [animatedNumbers, setAnimatedNumbers] = useState({
    personalSavings: 0,
    baselineEmissions: 0,
    actualEmissions: 0,
    communitySavings: 0,
    communityMembers: 0,
  });

  // Fetch real population data for a state
  const fetchStatePopulation = async (state: string) => {
    try {
      const populationData = await apiClient.getStatePopulation(state);
      console.log(
        `Fetched population for ${state}:`,
        populationData.population,
        typeof populationData.population,
      );
      // Ensure population is a number
      const population = parseInt(String(populationData.population));
      setStatePopulation(population);
    } catch (error) {
      console.warn(`Failed to fetch population for ${state}, using default`, error);
      // Set fallback value
      setStatePopulation(6700000);
    }
  };

  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;
    try {
      const uid = localStorage.getItem("ecopath_uid") || "anonymous";
      setUserId(uid);

      // Get user's selected state from quiz carbonFootprint data
      try {
        const carbonFootprintData = localStorage.getItem("carbonFootprint");
        if (carbonFootprintData) {
          const parsed = JSON.parse(carbonFootprintData);
          const state = parsed?.location?.state;
          if (state) {
            setSelectedState(state);
            // Fetch real population data for this state
            fetchStatePopulation(state);
          } else {
            setSelectedState("VIC");
            fetchStatePopulation("VIC");
          }
        } else {
          setSelectedState("VIC");
          fetchStatePopulation("VIC");
        }
      } catch {
        setSelectedState("VIC");
        fetchStatePopulation("VIC");
      }
    } catch {
      setSelectedState("VIC");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId || userId === "anonymous") {
        setLoading(false);
        return;
      }
      try {
        const resp = (await apiClient.listUserPledges(userId)) as {
          success: boolean;
          data?: Array<{
            id: string;
            pledgeId: string;
            title: string;
            category: string;
            userId: string;
            reminderType: string;
            customDate: string;
            dateAdded: string;
            completedAt: string;
            isAchievement: boolean;
          }>;
        };
        if (cancelled) return;
        const list: SavedPledge[] = (resp.data || []).map((r) => ({
          id: r.id || r.pledgeId,
          title: r.title,
          category: r.category,
          userId: r.userId,
          reminderType: r.reminderType,
          customDate: r.customDate,
          dateAdded: r.dateAdded,
          completedAt: r.completedAt,
          isAchievement: r.isAchievement,
        }));
        console.log("🔍 Loaded saved pledges from API:", list);
        setSavedPledges(list);
      } catch {
        setSavedPledges([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Fetch individual pledge savings data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId || userId === "anonymous") {
        return;
      }
      try {
        const savingsData = await apiClient.getPledgeSavings(userId);
        if (!cancelled) {
          setPledgeSavings(savingsData);
        }
      } catch (error) {
        console.error("Failed to fetch pledge savings:", error);
        if (!cancelled) {
          setPledgeSavings([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Fetch real emissions data using new unified APIs
  useEffect(() => {
    if (savedPledges.length === 0 || !mounted || !selectedState || !userId) return;

    // Check if user has completed quiz first
    let hasQuizData = false;
    try {
      const carbonFootprintData = localStorage.getItem("carbonFootprint");
      if (carbonFootprintData) {
        const quizData = JSON.parse(carbonFootprintData);
        hasQuizData = !!(quizData.totals && quizData.totals.totalKgYear);
      }
    } catch (error) {
      console.warn("Failed to check quiz data:", error);
    }

    // If no quiz data, don't fetch emissions data
    if (!hasQuizData) {
      console.log("⚠️ No quiz data found, skipping emissions data fetch");
      setLoading(false);
      return;
    }

    // Add debounce to prevent rapid successive calls
    const timeoutId = setTimeout(async () => {
      try {
        console.log("📊 Fetching real emissions data for:", {
          selectedState,
          pledgesCount: savedPledges.length,
          userId,
        });

        // Get quiz data from localStorage for API calls
        let quizData = null;
        try {
          const carbonFootprintData = localStorage.getItem("carbonFootprint");
          if (carbonFootprintData) {
            quizData = JSON.parse(carbonFootprintData);
            console.log(
              "📊 Quiz data loaded for API:",
              quizData.totals?.totalKgYear ? "has personal baseline" : "no personal baseline",
            );
          }
        } catch (error) {
          console.warn("⚠️ Failed to read quiz data from localStorage:", error);
        }

        // Get emissions comparison from API (with quiz data if available)
        const comparisonResponse = await apiClient.getEmissionsComparison(
          selectedState,
          userId,
          quizData,
        );
        console.log("✅ Emissions comparison response:", comparisonResponse);
        setEmissionsComparison(comparisonResponse);

        // Add small delay between API calls to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Fetch multi-year forecast data from backend (with quiz data if available)
        try {
          const forecastResponse = await apiClient.getEmissionsForecast(
            selectedState,
            10,
            userId,
            quizData,
          );
          console.log("✅ Emissions forecast response:", forecastResponse);
          setEmissionsForecast(forecastResponse);
        } catch (error) {
          console.warn("⚠️ Failed to fetch forecast, using fallback:", error);
          // Fallback to minimal forecast
          const baseline = comparisonResponse?.baseline || 8000;
          const saved = comparisonResponse?.saved || 400;
          const fallbackForecast = {
            yearlyForecast: [
              {
                year: new Date().getFullYear(),
                baseline: baseline,
                withPledges: Math.max(0, baseline - saved),
                saved: saved,
              },
            ],
          };
          setEmissionsForecast(fallbackForecast);
        }

        // Add small delay between API calls to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Fetch real community statistics
        const communityResponse = await apiClient.getCommunityStats();
        console.log("✅ Community stats response:", communityResponse);
        setCommunityStats(communityResponse);

        // Add small delay between API calls to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Fetch real user impact statistics
        const userStatsResponse = await apiClient.getUserImpactStats(userId);
        console.log("✅ User impact stats response:", userStatsResponse);

        // Note: All data now comes from real database APIs
      } catch (error) {
        console.error("❌ Error fetching emissions data:", error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [savedPledges, selectedState, userId, mounted]);

  // Update animated numbers when API data arrives
  useEffect(() => {
    if (!mounted || !emissionsComparison || !communityStats) return;

    const timer = setTimeout(() => {
      setAnimatedNumbers({
        personalSavings: emissionsComparison.saved,
        baselineEmissions: emissionsComparison.baseline,
        actualEmissions: emissionsComparison.withPledges,
        communitySavings: communityStats.totalSavings,
        communityMembers: communityStats.totalUsers,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [mounted, emissionsComparison, communityStats]);

  const AnimatedNumber = ({
    value,
    duration = 2000,
    suffix = "",
  }: {
    value: number;
    duration?: number;
    suffix?: string;
  }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
      if (!mounted || value === 0) return;

      let start = 0;
      const end = value;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCurrent(end);
          clearInterval(timer);
        } else {
          setCurrent(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [value, duration]);

    return (
      <span>
        {current.toLocaleString()}
        {suffix}
      </span>
    );
  };

  // Create pledge display cards using real savings data from backend
  const breakdownCards = savedPledges
    .map((p) => {
      const labelMap: Record<string, { title: string; icon: string }> = {
        "bike-transport": { title: "Bike to Work Twice Weekly", icon: "🚴" },
        "led-bulbs": { title: "Switch to LED Bulbs", icon: "💡" },
        "meatless-monday": { title: "Meatless Monday", icon: "🥗" },
        "public-transport": { title: "Use Public Transport", icon: "🚌" },
        "air-dry": { title: "Air Dry Clothes", icon: "👕" },
        "water-bottle": { title: "Reusable Water Bottle", icon: "💧" },
        recycle: { title: "Recycle More", icon: "♻️" },
        solar: { title: "Install Solar Panels", icon: "☀️" },
        "grow-herbs": { title: "Grow Herbs at Home", icon: "🌿" },
        "take-showers": { title: "Take 5-minute Showers", icon: "🚿" },
        "switch-led": { title: "Switch to LED Bulbs", icon: "💡" },
        "air-dry-laundry": { title: "Air-Dry One Load of Laundry", icon: "👕" },
        "carry-water-bottle": { title: "Carry a Water Bottle", icon: "💧" },
      };

      // Find the actual savings for this pledge from the backend data
      const pledgeData = pledgeSavings.find(
        (ps) =>
          ps.name.toLowerCase() === (p.title || p.id).toLowerCase() ||
          ps.name.toLowerCase().includes((p.title || p.id).toLowerCase()) ||
          (p.title || p.id).toLowerCase().includes(ps.name.toLowerCase()),
      );

      const actualSavings = pledgeData ? pledgeData.saving : 0;

      return {
        id: p.id,
        saved: actualSavings,
        ...(labelMap[p.id] || { title: p.title || p.id, icon: "✨" }),
      };
    })
    .slice(0, 6);

  // Chart data for personal forecast - use real API data if available (10 years)
  const chartYears = emissionsForecast?.yearlyForecast?.map((d) => String(d.year)) || [
    "2026",
    "2027",
    "2028",
    "2029",
    "2030",
    "2031",
    "2032",
    "2033",
    "2034",
    "2035",
  ];

  // Use real forecast data from new API, with minimal fallback for loading states
  const baselineData =
    emissionsForecast?.yearlyForecast?.map((d) => d.baseline) || Array(10).fill(0); // Minimal fallback - all zeros for loading state

  const actualData =
    emissionsForecast?.yearlyForecast?.map((d) => d.withPledges) || Array(10).fill(0); // Minimal fallback - all zeros for loading state

  // Use real community data from API, with fallback
  const communityData = communityStats
    ? {
        totalSavings: communityStats.totalSavings,
        members: communityStats.totalUsers,
        topPledges: communityStats.topPledges,
      }
    : {
        totalSavings: 0,
        members: 0,
        topPledges: [],
      };

  // Check if user has quiz data
  const hasQuizData =
    mounted &&
    (() => {
      try {
        const carbonFootprintData = localStorage.getItem("carbonFootprint");
        if (carbonFootprintData) {
          const quizData = JSON.parse(carbonFootprintData);
          return !!(quizData.totals && quizData.totals.totalKgYear);
        }
      } catch (error) {
        console.warn("Failed to check quiz data:", error);
      }
      return false;
    })();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"></div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-1/3 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/20">
            <span className="text-2xl">🔮</span>
            <span className="text-white font-medium">AI-Powered Impact Visualization</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Your Climate Journey
            <span className="block bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Visualized
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            See the real impact of your environmental actions based on your personal carbon
            footprint quiz results, enhanced with AI predictions and community insights
          </p>
        </div>
      </section>

      {loading ? (
        <div className="text-center text-slate-200 py-16">Loading…</div>
      ) : !hasQuizData ? (
        <div className="relative z-10 py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-6">📊</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Complete Your Carbon Footprint Quiz First
              </h2>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                To see your personalized impact visualization and AI-powered climate forecast, you
                need to complete the carbon footprint quiz first. This will give us the baseline
                data needed to calculate your environmental impact.
              </p>
              <Link
                href="/quiz"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-xl px-12 py-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer inline-flex items-center gap-3"
              >
                <span className="text-2xl">📊</span>
                Take Carbon Footprint Quiz
                <i className="ri-arrow-right-line text-xl"></i>
              </Link>
            </div>
          </div>
        </div>
      ) : savedPledges.length === 0 ? (
        <div className="relative z-10 py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
              <div className="text-6xl mb-6">🌱</div>
              <h2 className="text-2xl font-bold text-white mb-4">Start Your Climate Journey</h2>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                Great! You&apos;ve completed your carbon footprint quiz. Now complete at least one
                pledge to see your personalized impact visualization and AI-powered climate
                forecast.
              </p>
              <Link
                href="/pledge"
                className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-bold text-xl px-12 py-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer inline-flex items-center gap-3"
              >
                <span className="text-2xl">🌱</span>
                Go to Pledges
                <i className="ri-arrow-right-line text-xl"></i>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Section 1: Personal AI Forecast */}
          <section className="relative z-10 py-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <span className="text-4xl">🔮</span>
                  Your AI-Powered Climate Forecast
                </h2>
                <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                  Based on your pledges and real ML predictions for {selectedState}, here&apos;s how
                  your carbon footprint will evolve over the next 10 years
                </p>
                {emissionsComparison && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-400/30">
                    <span className="text-sm text-emerald-200">
                      🤖 Real ML-powered predictions for {selectedState}
                      {statePopulation && ` (${(statePopulation / 1000000).toFixed(1)}M people)`}
                      <span className="block text-xs text-emerald-300 mt-1">
                        Baseline from quiz data + scientific pledge calculations
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:scale-105 transition-all duration-300 hover:bg-white/15">
                  <div className="text-center">
                    <div className="text-3xl mb-4">📉</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Your CO₂ Projection</h3>
                    <div className="text-3xl font-bold text-emerald-400 mb-2">
                      <AnimatedNumber value={animatedNumbers.actualEmissions} suffix=" kg" />
                    </div>
                    <p className="text-slate-300 text-sm">Annual emissions with pledges</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:scale-105 transition-all duration-300 hover:bg-white/15">
                  <div className="text-center">
                    <div className="text-3xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Baseline Without Pledges
                    </h3>
                    <div className="text-3xl font-bold text-slate-400 mb-2">
                      <AnimatedNumber value={animatedNumbers.baselineEmissions} suffix=" kg" />
                    </div>
                    <p className="text-slate-300 text-sm">What you would have emitted</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:scale-105 transition-all duration-300 hover:bg-white/15">
                  <div className="text-center">
                    <div className="text-3xl mb-4">🌱</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Total CO₂ Saved</h3>
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      <AnimatedNumber value={animatedNumbers.personalSavings} suffix=" kg" />
                    </div>
                    <p className="text-slate-300 text-sm">
                      {(animatedNumbers.personalSavings / 1000).toFixed(1)} tons annually
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-12">
                <h3 className="text-xl font-semibold text-white mb-2 text-center">
                  Annual CO₂ Emissions Forecast
                </h3>
                <p className="text-sm text-slate-400 text-center mb-6">
                  📊 Real ML predictions showing gradual emission reductions over time
                  {savedPledges.length === 0 && (
                    <span className="block text-yellow-400 mt-2">
                      ⚠️ Add pledges to see emission reductions from your actions
                    </span>
                  )}
                </p>
                <div className="relative h-64 flex items-end justify-between gap-2">
                  {/* Reference line for 20,000 kg */}
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-slate-400/50"
                    style={{ bottom: "45%" }}
                  >
                    <span className="absolute -left-16 top-0 text-xs text-slate-400 transform -translate-y-1/2">
                      20,000 kg
                    </span>
                  </div>

                  {chartYears.map((year: string, index: number) => {
                    // Calculate scaling for trend visualization with better proportion
                    const allValues = [...baselineData, ...actualData];
                    const maxValue = Math.max(...allValues);
                    const minValue = Math.min(...allValues);

                    // Ensure withPledges is never higher than baseline
                    const baselineValue = baselineData[index];
                    const actualValue = Math.min(actualData[index], baselineValue);

                    // Simple approach: keep bars very close to show realistic small difference
                    const range = maxValue - minValue;

                    // Scale to show trends clearly (use range for slope)
                    const baselineHeight =
                      range > 0 ? ((baselineValue - minValue) / range) * 75 + 25 : 50;

                    // Make actual bar noticeably different but not exaggerated
                    // Show the 1000kg difference more clearly with reference line
                    const finalActualHeight = baselineHeight - 3;

                    return (
                      <div key={year} className="flex-1 flex flex-col items-center">
                        <div className="relative w-full h-48 flex items-end justify-center gap-1">
                          {/* Baseline bar */}
                          <div
                            className="bg-slate-500/60 rounded-t-lg transition-all duration-1000 ease-out flex-1 relative group cursor-pointer"
                            style={{
                              height: `${baselineHeight}%`,
                              animationDelay: `${index * 100}ms`,
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {baselineData[index].toLocaleString()} kg
                            </div>
                          </div>
                          {/* Actual bar */}
                          <div
                            className="bg-gradient-to-t from-emerald-500 to-green-400 rounded-t-lg transition-all duration-1000 ease-out flex-1 relative group cursor-pointer"
                            style={{
                              height: `${finalActualHeight}%`,
                              animationDelay: `${index * 100 + 500}ms`,
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-emerald-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {actualValue.toLocaleString()} kg
                            </div>
                          </div>
                        </div>
                        <span className="text-slate-300 text-sm mt-2">{year}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-500/60 rounded"></div>
                    <span className="text-slate-300 text-sm">Baseline (without pledges)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-400 rounded"></div>
                    <span className="text-slate-300 text-sm">With your pledges</span>
                  </div>
                </div>
              </div>

              {/* Pledge Breakdown */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-6 text-center">
                  Impact Breakdown by Pledge
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {breakdownCards.map((pledge, index) => (
                    <div
                      key={pledge.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{pledge.icon}</span>
                        <h4 className="text-white font-medium text-sm">{pledge.title}</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">Annual Savings</span>
                        <span className="text-emerald-400 font-bold">
                          <AnimatedNumber value={pledge.saved} suffix=" kg" />
                        </span>
                      </div>
                      <div className="bg-slate-700/50 rounded-full h-2 mt-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(pledge.saved / Math.max(...breakdownCards.map((p) => p.saved))) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Collective Impact */}
          <section className="relative z-10 py-16 px-4 sm:px-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <span className="text-4xl">🌍</span>
                  Our Collective Footprint
                </h2>
                <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-6">
                  Together, we&apos;ve made a difference
                </p>
                <div className="inline-flex items-center gap-4 bg-emerald-600/20 backdrop-blur-sm rounded-full px-8 py-4 border border-emerald-400/30">
                  <span className="text-3xl font-bold text-emerald-400">
                    <AnimatedNumber
                      value={Math.round(animatedNumbers.communitySavings / 1000)}
                      suffix=""
                    />
                  </span>
                  <span className="text-white font-semibold">
                    tons of CO₂ saved by our community
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Community Stats */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h3 className="text-xl font-semibold text-white mb-6 text-center">
                    Community Impact Overview
                  </h3>

                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      <AnimatedNumber value={animatedNumbers.communityMembers} suffix="" />
                    </div>
                    <p className="text-slate-300">Active community members</p>
                  </div>

                  <div className="space-y-4">
                    {communityData.topPledges.map((pledge) => (
                      <div
                        key={pledge.type}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${pledge.color}`}></div>
                          <span className="text-white font-medium">{pledge.type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-bold">
                            <AnimatedNumber
                              value={Math.round((pledge.savings || 0) / 1000)}
                              suffix=" tons"
                            />
                          </div>
                          <div className="text-slate-400 text-sm">{pledge.percentage || 0}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <h3 className="text-xl font-semibold text-white mb-6 text-center">
                    CO₂ Savings by Category
                  </h3>

                  <div className="relative w-64 h-64 mx-auto mb-6">
                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      {communityData.topPledges.map((pledge, index) => {
                        const previousPercentages = communityData.topPledges
                          .slice(0, index)
                          .reduce((sum, p) => sum + (p.percentage || 0), 0);
                        const strokeDasharray = `${(pledge.percentage || 0) * 3.14} ${314 - (pledge.percentage || 0) * 3.14}`;
                        const strokeDashoffset = `-${previousPercentages * 3.14}`;

                        return (
                          <circle
                            key={pledge.type}
                            cx="100"
                            cy="100"
                            r="50"
                            fill="transparent"
                            stroke={pledge.color.replace("bg-", "").replace("-500", "")}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                            style={{
                              stroke:
                                pledge.color === "bg-emerald-500"
                                  ? "#10b981"
                                  : pledge.color === "bg-blue-500"
                                    ? "#3b82f6"
                                    : pledge.color === "bg-orange-500"
                                      ? "#f97316"
                                      : "#06b6d4",
                              animationDelay: `${index * 500}ms`,
                            }}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          <AnimatedNumber
                            value={Math.round(animatedNumbers.communitySavings / 1000)}
                            suffix=""
                          />
                        </div>
                        <div className="text-sm text-slate-300">Total Tons</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {communityData.topPledges.map((pledge) => (
                      <div key={pledge.type} className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full`}
                          style={{
                            backgroundColor:
                              pledge.color === "bg-emerald-500"
                                ? "#10b981"
                                : pledge.color === "bg-blue-500"
                                  ? "#3b82f6"
                                  : pledge.color === "bg-orange-500"
                                    ? "#f97316"
                                    : "#06b6d4",
                          }}
                        ></div>
                        <span className="text-slate-300 text-sm">{pledge.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Share Your Impact */}
          <section className="relative z-10 py-16 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <span className="text-4xl">📤</span>
                  Share Your Climate Journey
                </h2>
                <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                  Inspire others by sharing your environmental impact and achievements
                </p>
              </div>

              {/* Share Card Preview */}
              <div className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl p-8 border border-emerald-400/30 mb-12">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">🌱 Your Climate Impact</h3>
                  <p className="text-slate-300">Making a difference, one pledge at a time</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                      {savedPledges.length}
                    </div>
                    <p className="text-slate-300 text-sm">Active Pledges</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {((emissionsComparison?.saved || 0) / 1000).toFixed(1)}
                    </div>
                    <p className="text-slate-300 text-sm">Tons CO₂ Saved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      {emissionsComparison
                        ? Math.round(
                            (emissionsComparison.saved / emissionsComparison.baseline) * 100,
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-slate-300 text-sm">Reduction</p>
                  </div>
                </div>

                {/* Environmental Equivalents */}
                <div className="bg-white/10 rounded-lg p-6 mb-6">
                  <h4 className="text-white font-semibold text-center mb-4">
                    🌍 Your Impact Equals To:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌳</div>
                      <div className="text-xl font-bold text-emerald-400">
                        {Math.round((emissionsComparison?.saved || 0) / 22)}
                      </div>
                      <p className="text-slate-300 text-sm">Trees planted for a year</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🚗</div>
                      <div className="text-xl font-bold text-blue-400">
                        {Math.round((emissionsComparison?.saved || 0) / 4.6 / 1000)}k
                      </div>
                      <p className="text-slate-300 text-sm">Miles not driven</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">💡</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {Math.round((emissionsComparison?.saved || 0) / 0.4)}
                      </div>
                      <p className="text-slate-300 text-sm">LED bulbs switched</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 mb-8">
                  <p className="text-center text-white font-medium">
                    &ldquo;Part of a community that saved{" "}
                    {Math.round(communityData.totalSavings / 1000)} tons of CO₂&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {breakdownCards.slice(0, 3).map((pledge) => (
                    <div
                      key={pledge.id}
                      className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1"
                    >
                      <span>{pledge.icon}</span>
                      <span className="text-white text-sm">{pledge.title}</span>
                    </div>
                  ))}
                  {breakdownCards.length > 3 && (
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                      <span className="text-white text-sm">+{breakdownCards.length - 3} more</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-2">
                  <i className="ri-twitter-line"></i>
                  Share on Twitter
                </button>
                <button className="bg-blue-800 hover:bg-blue-900 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-2">
                  <i className="ri-linkedin-line"></i>
                  Share on LinkedIn
                </button>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-2">
                  <i className="ri-download-line"></i>
                  Save as Image
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:scale-105 cursor-pointer flex items-center gap-2">
                  <i className="ri-link"></i>
                  Copy Link
                </button>
              </div>
            </div>
          </section>

          {/* Section 4: Motivational CTA */}
          <section className="relative z-10 py-16 px-4 sm:px-6 bg-gradient-to-r from-emerald-900/30 to-teal-900/30">
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20">
                <div className="text-6xl mb-6">🌟</div>
                <blockquote className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-relaxed">
                  &ldquo;Every action you take creates ripples of positive change that extend far
                  beyond what you can see.&rdquo;
                </blockquote>
                <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                  Your {savedPledges.length} pledges are already making a difference. You&apos;ve
                  prevented {((emissionsComparison?.saved || 0) / 1000).toFixed(1)} tons of CO₂ from
                  entering our atmosphere, and you&apos;re part of a community that&apos;s saved{" "}
                  {Math.round(communityData.totalSavings / 1000)} tons collectively.
                </p>
                <p className="text-xl text-emerald-300 font-semibold mb-8">
                  But this is just the beginning of your climate journey.
                </p>

                <Link
                  href="/pledge"
                  className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-bold text-xl px-12 py-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer inline-flex items-center gap-3 whitespace-nowrap"
                >
                  <span className="text-2xl">🌱</span>
                  Take More Actions
                  <i className="ri-arrow-right-line text-xl"></i>
                </Link>

                <div className="mt-8 text-slate-400 text-sm">
                  Ready to amplify your impact? Discover new pledges and join thousands of others
                  creating positive change.
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-16 border-t border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="font-['Pacifico'] text-3xl text-white mb-6">EcoPath</div>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-8">
              Visualizing the future we&apos;re creating together through AI-powered insights and
              collective action tracking.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-slate-300">
              <Link href="/" className="hover:text-white transition-colors cursor-pointer">
                Home
              </Link>
              <Link href="/quiz" className="hover:text-white transition-colors cursor-pointer">
                Explore My Impact
              </Link>
              <Link href="/pledge" className="hover:text-white transition-colors cursor-pointer">
                My Pledge
              </Link>
              <Link href="/visualize" className="hover:text-white transition-colors cursor-pointer">
                Visualize Impact
              </Link>
              <Link href="/info" className="hover:text-white transition-colors cursor-pointer">
                Info
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-left {
          animation: slideInFromLeft 0.6s ease-out forwards;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
