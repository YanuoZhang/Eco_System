"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import apiClient from "@/services/apiClient";

type ImpactLevel = "small" | "medium" | "large";

type Pledge = {
  id: string;
  icon: string;
  title: string;
  benefit: string;
  category: string;
  impact: ImpactLevel;
  aiReason?: string;
};

type SavedPledge = Pledge & {
  reminderType?: "once" | "daily" | "weekly" | "custom";
  customDate?: string;
  dateAdded?: string;
  recordId?: string; // server-side saved record id
};

type ReminderState = {
  [pledgeId: string]: { type: "once" | "daily" | "weekly" | "custom"; customDate: string };
};

export default function PledgePage() {
  const [activeTab, setActiveTab] = useState<"public" | "ai">("public");
  const [selectedPledges, setSelectedPledges] = useState<Pledge[]>([]);
  const [savedPledges, setSavedPledges] = useState<SavedPledge[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [pledgeReminders, setPledgeReminders] = useState<ReminderState>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState<Record<string, boolean>>({});
  const [rescheduleDate, setRescheduleDate] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string>("anonymous");
  // Temporary inputs for custom date(s)/ranges in modal
  const [customStart, setCustomStart] = useState<Record<string, string>>({});
  const [customEnd, setCustomEnd] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastQuizDataHash, setLastQuizDataHash] = useState<string | null>(null); // Track quiz data content

  // Helper function to save and load hash from localStorage
  const saveHashToStorage = (hash: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastQuizDataHash", hash);
    }
  };

  // Helper function to get stable quiz data (excluding dynamic fields)
  const getStableQuizData = (quizData: Record<string, unknown>) => {
    const stableData = {
      location: quizData.location,
      electricity: quizData.electricity,
      hotWater: quizData.hotWater,
      appliances: quizData.appliances,
      transport: quizData.transport,
      state: quizData.state,
      timeUnit: quizData.timeUnit,
      totals: quizData.totals,
      applianceBreakdown: quizData.applianceBreakdown,
      transportBreakdown: quizData.transportBreakdown,
      // Exclude savedAt and other dynamic fields
    };

    // Use a more robust JSON.stringify that properly handles nested objects
    const stableJsonString = JSON.stringify(stableData, (key, value) => {
      // Skip undefined values
      if (value === undefined) return undefined;
      // Sort object keys recursively
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const sortedObj: Record<string, unknown> = {};
        Object.keys(value)
          .sort()
          .forEach((k) => {
            sortedObj[k] = value[k];
          });
        return sortedObj;
      }
      return value;
    });

    return stableJsonString;
  };

  // Helper function to calculate hash from stable JSON string
  const calculateHash = (jsonString: string): string => {
    let hash = 0;
    if (jsonString.length === 0) return "0";
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & 0xffffffff; // Convert to 32bit signed integer
    }
    return Math.abs(hash).toString(16);
  };

  // Listen for quiz data changes via custom event

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let uid = localStorage.getItem("leafforward_uid");
      if (!uid || uid === "anonymous") {
        try {
          uid =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        } catch {
          uid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        }
      }
      localStorage.setItem("leafforward_uid", uid);
      setUserId(uid);
    } catch {}
    const quizData = localStorage.getItem("carbonFootprint");
    if (quizData) {
      setHasCompletedQuiz(true);
      setActiveTab("ai");

      // Calculate current quiz data hash (excluding dynamic fields like savedAt)
      const parsedQuizData = JSON.parse(quizData);
      const currentStableJson = getStableQuizData(parsedQuizData);
      const currentHash = calculateHash(currentStableJson);

      // Load data version from localStorage to check if quiz data changed
      let currentDataVersion = localStorage.getItem("quizDataVersion");

      // If no version exists but we have quiz data, create one
      if (!currentDataVersion && quizData) {
        currentDataVersion = Date.now().toString();
        localStorage.setItem("quizDataVersion", currentDataVersion);
      }

      const lastKnownDataVersion = localStorage.getItem("lastKnownQuizDataVersion");

      // Determine if quiz data has changed by comparing version numbers
      const quizDataChanged = !lastKnownDataVersion || lastKnownDataVersion !== currentDataVersion;

      // Set lastQuizDataHash to trigger AI useEffect comparison
      // If data changed, use a different hash to force refresh
      // If data unchanged, use the same hash to use cache
      if (quizDataChanged) {
        setLastQuizDataHash("CHANGED"); // Use special value to force refresh
        // Don't update lastKnownQuizDataVersion here - wait until AI recommendations are successfully loaded
      } else {
        setLastQuizDataHash(currentHash);
      }

      // Save current hash to localStorage for next comparison
      saveHashToStorage(currentHash);
    }
  }, []);

  // Avoid calling backend with placeholder userId
  useEffect(() => {
    if (userId === "anonymous") return;
  }, [userId]);

  const publicPledges: Pledge[] = useMemo(
    () => [
      {
        id: "reusable-bag",
        icon: "🛍️",
        title: "Use a reusable bag",
        benefit: "Save 170 plastic bags per year",
        category: "daily",
        impact: "small",
      },
      {
        id: "water-bottle",
        icon: "🚰",
        title: "Carry a water bottle",
        benefit: "Prevent 156 plastic bottles annually",
        category: "daily",
        impact: "small",
      },
      {
        id: "bike-transport",
        icon: "🚴",
        title: "Bike to work once a week",
        benefit: "Reduce 520kg CO₂ per year",
        category: "transport",
        impact: "medium",
      },
      {
        id: "meatless-monday",
        icon: "🥗",
        title: "Try Meatless Monday",
        benefit: "Save 600kg CO₂ annually",
        category: "diet",
        impact: "medium",
      },
      {
        id: "led-bulbs",
        icon: "💡",
        title: "Switch to LED bulbs",
        benefit: "Cut lighting energy by 75%",
        category: "energy",
        impact: "medium",
      },
      {
        id: "shorter-showers",
        icon: "🚿",
        title: "Take 5-minute showers",
        benefit: "Save 30,000L water yearly",
        category: "water",
        impact: "small",
      },
      {
        id: "public-transport",
        icon: "🚌",
        title: "Use public transport",
        benefit: "Reduce transport emissions by 45%",
        category: "transport",
        impact: "large",
      },
      {
        id: "local-food",
        icon: "🌾",
        title: "Buy local produce",
        benefit: "Support community & reduce transport",
        category: "diet",
        impact: "medium",
      },
      {
        id: "air-dry",
        icon: "👕",
        title: "Air dry clothes",
        benefit: "Save 300kg CO₂ per year",
        category: "energy",
        impact: "small",
      },
      {
        id: "thermostat",
        icon: "🌡️",
        title: "Adjust thermostat by 2°C",
        benefit: "Reduce heating costs by 20%",
        category: "energy",
        impact: "large",
      },
      {
        id: "walk-short",
        icon: "🚶",
        title: "Walk for trips under 1km",
        benefit: "Zero emissions for short trips",
        category: "transport",
        impact: "small",
      },
      {
        id: "plant-herbs",
        icon: "🌿",
        title: "Grow herbs at home",
        benefit: "Fresh food with zero food miles",
        category: "diet",
        impact: "small",
      },
    ],
    [],
  );

  const [aiSuggestedPledges, setAiSuggestedPledges] = useState<Pledge[]>([]);

  // Build a quick lookup for pledge meta from both sources
  const pledgeMetaById = useMemo(() => {
    const pool = [...publicPledges, ...aiSuggestedPledges];
    const map = new Map<string, Partial<Pledge>>();
    pool.forEach((p) => {
      const meta = {
        title: p.title,
        icon: p.icon,
        benefit: p.benefit,
        category: p.category,
        impact: p.impact,
      };
      // Add mapping for both id and title to handle different storage formats
      map.set(p.id, meta);
      if (p.title && p.title !== p.id) {
        map.set(p.title, meta);
      }
    });
    return map;
  }, [publicPledges, aiSuggestedPledges]);

  // Load saved pledges from backend
  useEffect(() => {
    if (!userId || userId === "anonymous") return;
    let cancelled = false;
    (async () => {
      try {
        const resp = (await apiClient.listUserPledges(userId)) as {
          success: boolean;
          data?: Array<{
            id: string;
            pledgeId: string;
            reminderType?: string;
            customDate?: string;
            dateAdded?: string;
            title?: string;
            category?: string;
            isAchievement?: boolean;
          }>;
        };
        if (!resp?.success || !resp.data) return;

        // Filter only active pledges (not achievements)
        const activePledges = resp.data.filter((r) => !r.isAchievement);

        const list: SavedPledge[] = activePledges.map((r) => {
          // Use pledgeId first (the actual saved ID), then title as fallback
          const pledgeId = r.pledgeId || r.title || "unknown";

          // Try to get metadata from pledgeMetaById using both pledgeId and title
          const meta = pledgeMetaById.get(pledgeId) || pledgeMetaById.get(r.title || "") || {};

          return {
            id: pledgeId,
            recordId: r.id,
            reminderType: r.reminderType as SavedPledge["reminderType"],
            customDate: r.customDate || "",
            dateAdded: r.dateAdded || "",
            // Use data from backend first, then fill meta if known
            title: r.title || meta.title || "",
            category: r.category || meta.category || "",
            benefit: meta.benefit || "",
            icon: meta.icon || "",
            impact: meta.impact || "small",
          };
        });
        if (!cancelled) setSavedPledges(list);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!hasCompletedQuiz) return;

    let cancelled = false;
    (async () => {
      try {
        setAiLoading(true);
        setAiError(null);
        const raw = typeof window !== "undefined" ? localStorage.getItem("carbonFootprint") : null;
        if (!raw) {
          setAiLoading(false);
          return;
        }
        const quizData = JSON.parse(raw);

        // Check if quiz data content has actually changed by comparing hashes
        const currentStableJson = getStableQuizData(quizData);
        const currentHash = calculateHash(currentStableJson);

        // Force refresh if lastQuizDataHash is 'CHANGED' (special value indicating data changed)
        // or if the hashes are different
        const forceRefresh = lastQuizDataHash === "CHANGED" || lastQuizDataHash !== currentHash;

        const resp = (await apiClient.getAiRecommendations(
          {
            quizData,
          },
          forceRefresh,
        )) as {
          success: boolean;
          data?: unknown;
        };
        if (cancelled) return;
        type AiRecommendation = {
          id: string;
          title: string;
          description?: string;
          category: string;
          impact?: string;
          aiReason?: string;
        };

        const isAiRecommendation = (value: unknown): value is AiRecommendation => {
          if (typeof value !== "object" || value === null) return false;
          const obj = value as Record<string, unknown>;
          return (
            typeof obj.id === "string" &&
            typeof obj.title === "string" &&
            typeof obj.category === "string"
          );
        };

        const isAiRecommendationArray = (value: unknown): value is AiRecommendation[] =>
          Array.isArray(value) && value.every((v) => isAiRecommendation(v));

        const hasRecommendationsArray = (
          value: unknown,
        ): value is { recommendations: AiRecommendation[] } => {
          if (typeof value !== "object" || value === null) return false;
          const obj = value as Record<string, unknown>;
          return isAiRecommendationArray(obj.recommendations);
        };

        const rawData: unknown = resp?.data;

        const list: AiRecommendation[] = isAiRecommendationArray(rawData)
          ? rawData
          : hasRecommendationsArray(rawData)
            ? rawData.recommendations
            : [];

        if (resp?.success && list.length > 0) {
          const mapped: Pledge[] = list.map((r) => ({
            id: r.id,
            icon: "✨",
            title: r.title,
            benefit: r.description || "",
            category: r.category,
            impact: (r.impact as ImpactLevel) || "medium",
            aiReason: r.aiReason,
          }));
          setAiSuggestedPledges(mapped);

          // Update lastQuizDataHash to current hash after successful load
          // This prevents unnecessary refreshes on subsequent loads with same data
          if (lastQuizDataHash === "CHANGED") {
            setLastQuizDataHash(currentHash);

            // Also update the last known data version to prevent future unnecessary refreshes
            const currentDataVersion = localStorage.getItem("quizDataVersion");
            if (currentDataVersion) {
              localStorage.setItem("lastKnownQuizDataVersion", currentDataVersion);
            }
          }

          // Don't update hash here - it should only be updated when quiz data actually changes
        } else {
          setAiSuggestedPledges([]);
        }
      } catch {
        setAiError("Failed to load AI suggestions");
        setAiSuggestedPledges([]);
      } finally {
        setAiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasCompletedQuiz, lastQuizDataHash]);

  // Clear AI recommendations when quiz data changes (triggered by quizDataUpdated event)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleQuizDataUpdate = () => {
      // Clear AI recommendations to force reload with new data
      setAiSuggestedPledges([]);
    };

    // Listen for custom quiz data update events
    window.addEventListener("quizDataUpdated", handleQuizDataUpdate);

    return () => {
      window.removeEventListener("quizDataUpdated", handleQuizDataUpdate);
    };
  }, [aiSuggestedPledges.length]); // Add dependency to ensure we have latest state

  const getCurrentPledges = () => (activeTab === "public" ? publicPledges : aiSuggestedPledges);

  const handlePledgeToggle = (pledge: Pledge) => {
    setSelectedPledges((prev) => {
      const exists = prev.some((p) => p.id === pledge.id);
      return exists ? prev.filter((p) => p.id !== pledge.id) : [...prev, pledge];
    });
  };

  const removePledgeFromSelection = (pledgeId: string) => {
    setSelectedPledges((prev) => prev.filter((p) => p.id !== pledgeId));
    setPledgeReminders((prev) => {
      const updated = { ...prev };
      delete updated[pledgeId];
      return updated;
    });
  };

  const openReminderModal = () => {
    if (selectedPledges.length === 0) return;
    const initial: ReminderState = {};
    selectedPledges.forEach((p) => (initial[p.id] = { type: "daily", customDate: "" }));
    setPledgeReminders(initial);
    setShowReminderModal(true);
  };

  const handleReminderChange = (
    pledgeId: string,
    type: "once" | "daily" | "weekly" | "custom",
    customDate = "",
  ) => {
    setPledgeReminders((prev) => ({ ...prev, [pledgeId]: { type, customDate } }));
  };

  const addCustomToken = (pledgeId: string) => {
    const start = (customStart[pledgeId] || "").trim();
    const end = (customEnd[pledgeId] || "").trim();
    if (!start) return;
    const token = end ? `${start}:${end}` : start;
    const prev = pledgeReminders[pledgeId]?.customDate || "";
    const next = prev ? `${prev},${token}` : token;
    handleReminderChange(pledgeId, "custom", next);
    setCustomStart((p) => ({ ...p, [pledgeId]: "" }));
    setCustomEnd((p) => ({ ...p, [pledgeId]: "" }));
  };

  const removeCustomToken = (pledgeId: string, token: string) => {
    const prev = pledgeReminders[pledgeId]?.customDate || "";
    const next = prev
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => t !== token)
      .join(",");
    handleReminderChange(pledgeId, "custom", next);
  };

  const generateBatchCalendarFile = (pledges: SavedPledge[]) => {
    const now = new Date();
    let icsContent = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//EcoPath//Climate Pledge Reminder//EN\r\nMETHOD:PUBLISH\r\n`;
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const escapeText = (text: string) => text.replace(/[,\\;]/g, "\\$&").replace(/\n/g, "\\n");
    const createEvent = (title: string, description: string, date: Date, uid: string) =>
      `\r\nBEGIN:VEVENT\r\nUID:${uid}@ecopath.com\r\nDTSTAMP:${formatDate(now)}\r\nDTSTART:${formatDate(date)}\r\nDTEND:${formatDate(new Date(date.getTime() + 60 * 60 * 1000))}\r\nSUMMARY:${escapeText(title)}\r\nDESCRIPTION:${escapeText(description)}\r\nBEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\nDESCRIPTION:Reminder: ${escapeText(title)}\r\nEND:VALARM\r\nEND:VEVENT\r\n`;

    pledges.forEach((pledge, idx) => {
      const reminderType = pledge.reminderType;
      const customDate = pledge.customDate;
      const startDate = customDate ? new Date(customDate) : now;
      if (reminderType === "daily") {
        const endOfYear = new Date(new Date().getFullYear(), 11, 31);
        const days = Math.max(
          1,
          Math.ceil((endOfYear.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1,
        );
        for (let i = 0; i < days; i++) {
          const eventDate = new Date(startDate);
          eventDate.setDate(eventDate.getDate() + i);
          icsContent += createEvent(
            `Daily Reminder: ${pledge.title}`,
            `Your daily climate action: ${pledge.title.toLowerCase()}. ${pledge.benefit}`,
            eventDate,
            `pledge-${pledge.id}-daily-${i}-${idx}`,
          );
        }
      } else if (reminderType === "weekly") {
        const endOfYear = new Date(new Date().getFullYear(), 11, 31);
        const weeks = Math.max(
          1,
          Math.ceil((endOfYear.getTime() - startDate.getTime()) / (7 * 24 * 3600 * 1000)) + 1,
        );
        for (let i = 0; i < weeks; i++) {
          const eventDate = new Date(startDate);
          eventDate.setDate(eventDate.getDate() + i * 7);
          icsContent += createEvent(
            `Weekly Reminder: ${pledge.title}`,
            `Your weekly climate action: ${pledge.title.toLowerCase()}. ${pledge.benefit}`,
            eventDate,
            `pledge-${pledge.id}-weekly-${i}-${idx}`,
          );
        }
      } else if (reminderType === "custom") {
        const dates = (customDate || "")
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);
        dates.forEach((d, j) => {
          const eventDate = new Date(d);
          icsContent += createEvent(
            `Reminder: ${pledge.title}`,
            `Remember to ${pledge.title.toLowerCase()}. ${pledge.benefit}`,
            eventDate,
            `pledge-${pledge.id}-custom-${j}-${idx}`,
          );
        });
      }
    });
    icsContent += `\r\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar; charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ecopath-pledges-${pledges.length}-items.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSavePledges = async () => {
    const newSaved: SavedPledge[] = selectedPledges.map((p) => ({
      ...p,
      reminderType: pledgeReminders[p.id]?.type || "weekly",
      customDate: pledgeReminders[p.id]?.customDate || "",
      dateAdded: new Date().toISOString(),
    }));
    // Persist to backend
    try {
      const payload = {
        userId,
        pledges: newSaved.map((p) => ({
          pledgeId: p.id,
          title: p.title,
          category: p.category,
          reminderType: p.reminderType,
          customDate: p.customDate,
        })),
      };
      const resp = (await apiClient.saveUserPledges(payload)) as {
        success: boolean;
        data?: Array<{
          id: string;
          pledgeId: string;
          reminderType?: string;
          customDate?: string;
          dateAdded?: string;
          title?: string;
          category?: string;
        }>;
      };
      if (resp?.success) {
        // Merge server-added records
        const added = (resp.data || []).map((r) => {
          const pledgeId = r.title || r.pledgeId;
          const meta = [...publicPledges, ...aiSuggestedPledges].find(
            (m) => m.id === pledgeId || m.title === r.title,
          );
          return {
            id: pledgeId,
            recordId: r.id,
            reminderType: r.reminderType as SavedPledge["reminderType"],
            customDate: r.customDate,
            dateAdded: r.dateAdded,
            title: r.title || meta?.title || pledgeId,
            category: r.category || meta?.category || "",
            benefit: meta?.benefit || "",
            icon: meta?.icon || "",
            impact: meta?.impact || "small",
          } as SavedPledge;
        });
        const existingByRecord = new Set(savedPledges.map((s) => s.recordId));
        const updated = [
          ...savedPledges,
          ...added.filter((a) => !existingByRecord.has(a.recordId)),
        ];
        setSavedPledges(updated);
      }
    } catch {}
    generateBatchCalendarFile(newSaved);
    setShowReminderModal(false);
    setSelectedPledges([]);
    setPledgeReminders({});
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const downloadCalendarFor = (pledge: SavedPledge) => {
    // Re-generate calendar event(s) for a single saved pledge using its stored reminder settings
    generateBatchCalendarFile([
      {
        ...pledge,
        reminderType: pledge.reminderType || "weekly",
        customDate: pledge.customDate || "",
      },
    ]);
  };

  const removePledge = async (pledgeId: string) => {
    const target = savedPledges.find((p) => p.id === pledgeId);
    if (target?.recordId) {
      try {
        await apiClient.deleteUserPledge(target.recordId, userId);
      } catch {}
    }
    const updated = savedPledges.filter((p) => p.id !== pledgeId);
    setSavedPledges(updated);
  };

  const saveReschedule = async (pledgeId: string) => {
    const date = rescheduleDate[pledgeId];
    const newType: SavedPledge["reminderType"] = date ? "custom" : "weekly";
    const updated: SavedPledge[] = savedPledges.map((p) =>
      p.id === pledgeId ? { ...p, reminderType: newType, customDate: date || "" } : p,
    );
    setSavedPledges(updated);
    const rec = updated.find((p) => p.id === pledgeId);
    if (rec?.recordId) {
      try {
        await apiClient.rescheduleUserPledge(rec.recordId, {
          userId,
          reminderType: rec.reminderType,
          customDate: rec.customDate,
        });
      } catch {}
    }
    setRescheduleOpen((prev) => ({ ...prev, [pledgeId]: false }));
    // Optionally regenerate calendar file for this single pledge
    const target = updated.find((p) => p.id === pledgeId)!;
    downloadCalendarFor(target);
  };

  const getImpactColor = (impact: ImpactLevel) =>
    impact === "small"
      ? "text-emerald-600 bg-emerald-100"
      : impact === "medium"
        ? "text-blue-600 bg-blue-100"
        : "text-purple-600 bg-purple-100";

  const isPledgeSelected = (id: string) => selectedPledges.some((p) => p.id === id);
  const isPledgeAlreadySaved = (id: string, title: string) => {
    return savedPledges.some((saved) => {
      // Match by id
      if (saved.id === id) return true;
      // Match by title (case-insensitive to be safe)
      if (saved.id === title || saved.title === title) return true;
      // Also check if the saved pledge's title matches current id (for reverse match)
      if (saved.title === id) return true;
      return false;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50 to-sky-50">
      {/* Hidden heading for accessibility and unit tests */}
      <h1 className="sr-only">Pledge</h1>
      {/* Hero */}

      {/* Pledge Section */}
      <section id="pledge-section" className="py-16 px-4 sm:px-6 pb-28">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-200/50 shadow-lg">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab("public")}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 cursor-pointer ${
                    activeTab === "public"
                      ? "bg-gradient-to-r from-slate-100 to-emerald-50 text-slate-800 shadow-md"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🌍</span>
                    <span>Public Pledges</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 cursor-pointer relative ${
                    activeTab === "ai"
                      ? "bg-gradient-to-r from-sky-50 to-emerald-50 text-slate-800 shadow-md"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">🤖</span>
                    <span>AI Suggestions</span>
                  </div>
                  {hasCompletedQuiz && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {activeTab === "ai" && !hasCompletedQuiz && (
              <div className="mt-6 bg-sky-100/80 backdrop-blur-sm rounded-xl p-6 border border-sky-200/50">
                <div className="text-center">
                  <div className="text-3xl mb-3">🎯</div>
                  <p className="text-sky-800 mb-4">
                    Complete your carbon footprint quiz to unlock personalized AI suggestions
                    tailored to your lifestyle!
                  </p>
                  <Link
                    href="/quiz"
                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors cursor-pointer inline-block"
                  >
                    Take the Quiz →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Pledge Cards */}
          {activeTab === "ai" && hasCompletedQuiz && (
            <>
              {aiLoading && (
                <div className="text-center text-slate-600 py-8">Loading AI suggestions…</div>
              )}
              {!aiLoading && aiError && (
                <div className="text-center text-red-600 py-8">{aiError}</div>
              )}
              {!aiLoading && !aiError && aiSuggestedPledges.length === 0 && (
                <div className="text-center text-slate-600 py-8">
                  <div>No suggestions yet.</div>
                  <div className="text-sm mt-2 opacity-60"></div>
                </div>
              )}
            </>
          )}

          {(activeTab === "public" ||
            (activeTab === "ai" && hasCompletedQuiz && aiSuggestedPledges.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {getCurrentPledges().map((pledge) => {
                const selected = isPledgeSelected(pledge.id);
                const already = isPledgeAlreadySaved(pledge.id, pledge.title);
                return (
                  <div
                    key={pledge.id}
                    onClick={() => !already && handlePledgeToggle(pledge)}
                    className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300 ${
                      already
                        ? "border-gray-300 bg-gray-100/90 opacity-60 cursor-not-allowed grayscale"
                        : selected
                          ? "border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-200/50 scale-105 cursor-pointer hover:scale-105 hover:shadow-xl"
                          : "border-slate-200/50 hover:border-emerald-300/50 cursor-pointer hover:scale-105 hover:shadow-xl"
                    }`}
                  >
                    <div className="flex justify_between items-start mb-4">
                      <div className="text-4xl">{pledge.icon}</div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          already
                            ? "border-gray-400 bg-gray-200"
                            : selected
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-300"
                        }`}
                      >
                        {already ? (
                          <i className="ri-check-line text-gray-600 text-sm" />
                        ) : selected ? (
                          <i className="ri-check-line text-white text-sm" />
                        ) : null}
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{pledge.title}</h3>
                      <p className="text-emerald-700 font-medium mb-3">{pledge.benefit}</p>
                      {pledge.aiReason && (
                        <div className="bg-sky-100/80 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-center gap-2 text-sm text-sky-800">
                            <span className="text-base">🤖</span>
                            <span>{pledge.aiReason}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getImpactColor(pledge.impact)}`}
                        >
                          {pledge.impact.toUpperCase()} IMPACT
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-100">
                          {pledge.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {already && (
                      <div className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl text-center border-2 border-gray-300">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl">✅</span>
                          <span className="uppercase text-sm tracking-wide">Already Added</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Saved Pledges */}
          {savedPledges.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center flex items-center justify-center gap-3">
                <span className="text-3xl">🎯</span>
                <span>Your Active Pledges</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedPledges.map((pledge) => (
                  <div
                    key={pledge.id}
                    className="bg-gradient-to-r from-emerald-50 to_green-50 rounded-xl p-6 border border-emerald-200/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{pledge.icon}</span>
                        <div>
                          <h3 className="font-semibold text-slate-800">{pledge.title}</h3>
                          <p className="text-sm text-emerald-700">{pledge.benefit}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removePledge(pledge.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <i className="ri-close-line text-lg" />
                      </button>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-base">📅</span>
                        <span>
                          Reminder:{" "}
                          {pledge.reminderType === "custom"
                            ? pledge.customDate
                              ? pledge.customDate
                                  .split(",")
                                  .map((d) => d.trim())
                                  .filter(Boolean)
                                  .map((date) => {
                                    if (date.includes(":")) {
                                      const [start, end] = date.split(":");
                                      return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
                                    }
                                    return new Date(date).toLocaleDateString();
                                  })
                                  .join(", ")
                              : "-"
                            : pledge.reminderType}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setRescheduleOpen((prev) => ({
                              ...prev,
                              [pledge.id]: !prev[pledge.id],
                            }))
                          }
                          className="text-slate-700 hover:text-slate-900 font-medium text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Reschedule
                        </button>
                        {rescheduleOpen[pledge.id] && (
                          <>
                            <input
                              type="date"
                              value={rescheduleDate[pledge.id] ?? pledge.customDate ?? ""}
                              onChange={(e) =>
                                setRescheduleDate((prev) => ({
                                  ...prev,
                                  [pledge.id]: e.target.value,
                                }))
                              }
                              className="p-2 border border-slate-300 rounded-lg text-sm"
                              min={new Date().toISOString().split("T")[0]}
                            />
                            <button
                              onClick={() => saveReschedule(pledge.id)}
                              className="text-white bg-emerald-600 hover:bg-emerald-700 font-medium text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => downloadCalendarFor(pledge)}
                          className="text-emerald-700 hover:text-emerald-800 font-medium text-sm px-3 py-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Download calendar for this pledge"
                        >
                          Download Calendar
                        </button>
                        <button
                          onClick={() => removePledge(pledge.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove this pledge"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-slate-600 mb-4">
                  You are making a difference! {savedPledges.length} active pledge
                  {savedPledges.length !== 1 ? "s" : ""} working toward a better future.
                </p>
                <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg p-4 inline-block mb-6">
                  <div className="text-2xl mb-2">🌍</div>
                  <div className="text-sm text-emerald-800 font-semibold">
                    Every action counts. Thank you for being part of the solution!
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/visualize"
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer inline-flex items-center gap-3 whitespace-nowrap"
                  >
                    <span className="text-xl">🔮</span>
                    <span>Visualize Your Future</span>
                    <i className="ri-arrow-right-line text-lg" />
                  </Link>
                  <p className="text-slate-500 text-sm mt-3 max-w-md mx-auto">
                    See how your pledges will impact the future with AI-powered predictions
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Bar (restored) */}
      {selectedPledges.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-emerald-200/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedPledges.length}
                  </div>
                  <span className="text-slate-800 font-semibold whitespace-nowrap">
                    {selectedPledges.length} pledges selected
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  {selectedPledges.slice(0, 3).map((pledge) => (
                    <div
                      key={pledge.id}
                      className="flex items-center gap-1 bg-emerald-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{pledge.icon}</span>
                      <span className="text-xs text-emerald-800 truncate max-w-20">
                        {pledge.title}
                      </span>
                    </div>
                  ))}
                  {selectedPledges.length > 3 && (
                    <div className="text-xs text-slate-600">+{selectedPledges.length - 3} more</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedPledges([])}
                  className="text-slate-500 hover:text-slate-700 transition-colors cursor-pointer px-4 py-2"
                >
                  Clear All
                </button>
                <button
                  onClick={openReminderModal}
                  className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold px-6 sm:px-8 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer whitespace-nowrap"
                >
                  Set Reminders & Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Reminder Modal */}
      {showReminderModal && selectedPledges.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowReminderModal(false)}
              aria-label="Close"
              title="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="ri-close-line text-xl" />
            </button>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                Set Reminders for Each Pledge
              </h3>
              <p className="text-slate-600">
                Configure reminder frequency for your selected {selectedPledges.length} pledge
                {selectedPledges.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-6 mb-6">
              {selectedPledges.map((pledge) => (
                <div
                  key={pledge.id}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-200 relative"
                >
                  <button
                    onClick={() => removePledgeFromSelection(pledge.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove this pledge"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                  <div className="flex items-center gap-3 mb-4 pr-12">
                    <span className="text-2xl">{pledge.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{pledge.title}</h4>
                      <p className="text-sm text-slate-600">{pledge.benefit}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(["daily", "weekly", "custom"] as const).map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-white transition-colors"
                      >
                        <input
                          type="radio"
                          name={`reminder-${pledge.id}`}
                          value={t}
                          checked={pledgeReminders[pledge.id]?.type === t}
                          onChange={() => handleReminderChange(pledge.id, t)}
                          className="text-emerald-600"
                        />
                        <div className="flex-1">
                          <span className="text-slate-800 font-medium text-sm">
                            {t === "daily" ? "Daily" : t === "weekly" ? "Weekly" : "Custom Date"}
                          </span>
                          <p className="text-xs text-slate-600">
                            {t === "daily"
                              ? "From today for 30 days"
                              : t === "weekly"
                                ? "From today for 12 weeks"
                                : "Specific date(s) or ranges"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {pledgeReminders[pledge.id]?.type === "custom" && (
                    <div className="mt-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="date"
                          value={customStart[pledge.id] || ""}
                          onChange={(e) =>
                            setCustomStart((p) => ({ ...p, [pledge.id]: e.target.value }))
                          }
                          className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                          min={new Date().toISOString().split("T")[0]}
                          placeholder="Start date"
                        />
                        <input
                          type="date"
                          value={customEnd[pledge.id] || ""}
                          onChange={(e) =>
                            setCustomEnd((p) => ({ ...p, [pledge.id]: e.target.value }))
                          }
                          className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                          min={customStart[pledge.id] || new Date().toISOString().split("T")[0]}
                          placeholder="End date (optional)"
                        />
                        <button
                          onClick={() => addCustomToken(pledge.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {pledgeReminders[pledge.id]?.type === "custom" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(pledgeReminders[pledge.id]?.customDate || "")
                        .split(",")
                        .map((d) => d.trim())
                        .filter(Boolean)
                        .map((token) => {
                          const isRange = token.includes(":");
                          const label = isRange
                            ? `${new Date(token.split(":")[0]).toLocaleDateString()} → ${new Date(token.split(":")[1]).toLocaleDateString()}`
                            : new Date(token).toLocaleDateString();
                          return (
                            <span
                              key={token}
                              className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded inline-flex items-center gap-1"
                            >
                              {label}
                              <button
                                onClick={() => removeCustomToken(pledge.id, token)}
                                className="text-emerald-700 hover:text-emerald-900"
                                aria-label="Remove date"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      {(pledgeReminders[pledge.id]?.customDate || "") && (
                        <button
                          onClick={() => handleReminderChange(pledge.id, "custom", "")}
                          className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                        >
                          Clear dates
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectedPledges.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🤷‍♀️</div>
                <p className="text-slate-600 mb-4">
                  No pledges selected. Please select some pledges first.
                </p>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
                >
                  Back to Selection
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePledges}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 cursor-pointer"
                >
                  Save All Pledges
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="font-semibold">Nice! Calendar reminders are ready.</span>
          </div>
        </div>
      )}
    </div>
  );
}
