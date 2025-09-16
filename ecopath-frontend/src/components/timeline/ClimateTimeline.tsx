"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// Define a local type to avoid importing server-only modules in a client component
type TimelineEvent = {
  year: number;
  title: string;
  description: string;
  icon?: string;
  category: string;
};
type TimelinePeriod = {
  period: string;
  years: string;
  events: TimelineEvent[];
  title?: string;
  dramaticText?: string;
  childPerspective?: string;
  visual?: string;
};
import apiClient from "@/services/apiClient";
import Image from "next/image";

// Removed unused Period type to satisfy linter

type Props = {
  periods?: TimelinePeriod[];
};

export default function ClimateTimeline({ periods }: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [data, setData] = useState<TimelinePeriod[]>(periods ?? []);
  const [loading, setLoading] = useState<boolean>(!periods || periods.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Client-side fetch if no SSR data provided
  useEffect(() => {
    if (data.length > 0) return;
    let mounted = true;
    setLoading(true);
    apiClient
      .getTimeline()
      .then((res) => {
        if (!mounted) return;
        setData(res.data as unknown as TimelinePeriod[]);
      })
      .catch((err) => mounted && setError(err?.message ?? "Failed to load timeline"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [data.length]);

  // Note: previously used IntersectionObserver to lazy-reveal; now default to visible

  const active = useMemo(() => data[activeIndex], [activeIndex, data]);

  // Loading / Error / Empty states (render early to avoid undefined accesses)
  if (loading) {
    return (
      <section id="timeline-section" aria-label="Climate Timeline" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-white">Loading timeline…</h3>
            <p className="text-slate-300">Fetching climate story from API</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-100/10 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="timeline-section" aria-label="Climate Timeline" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl font-semibold text-red-200">Failed to load timeline</h3>
          <p className="text-slate-300 text-sm">{error}</p>
        </div>
      </section>
    );
  }

  if (!active || data.length === 0) {
    return (
      <section id="timeline-section" aria-label="Climate Timeline" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl font-semibold text-slate-200">No timeline data</h3>
          <p className="text-slate-300 text-sm">Please try again later</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="timeline-section"
      ref={sectionRef}
      aria-label="Climate Timeline"
      className="py-12 relative overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-slate-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-slate-700/60 text-slate-100 px-4 py-2 rounded-full border border-slate-500/40 mb-4">
            <span>📖</span>
            <span>Climate Story Timeline</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">How We Got Here</h3>
          <p className="text-slate-200 max-w-3xl mx-auto">
            From the first smokestack to today&apos;s crossroads - witness the climate story across
            generations.
          </p>
        </div>

        {/* Period navigation */}
        <div className="w-full overflow-hidden mb-6">
          <div className="flex justify-center">
            <div
              className="flex gap-2 sm:gap-4 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {data.map((step, index) => (
                <button
                  key={`${step.period}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  className={
                    "flex-shrink-0 px-3 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap " +
                    (activeIndex === index
                      ? index < 2
                        ? "bg-slate-600 text-white shadow scale-105"
                        : index < 4
                          ? "bg-blue-600 text-white shadow scale-105"
                          : "bg-teal-600 text-white shadow scale-105"
                      : index < 2
                        ? "bg-slate-700/70 text-slate-200 hover:bg-slate-600/70 border border-slate-500/40"
                        : index < 4
                          ? "bg-blue-700/70 text-blue-200 hover:bg-blue-600/70 border border-blue-500/40"
                          : "bg-teal-700/70 text-teal-200 hover:bg-teal-600/70 border border-teal-500/40")
                  }
                >
                  <span className="hidden sm:block">{step.period}</span>
                  <span className="block sm:hidden">
                    <div className="text-xs">{step.period.split("-")[0]}</div>
                    <div className="text-xs opacity-75">{step.period.split("-")[1]}</div>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active story card */}
        <div
          className={
            "rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm " +
            (activeIndex < 2
              ? "bg-slate-700/70 border border-slate-500/50"
              : activeIndex < 4
                ? "bg-blue-700/70 border border-blue-500/50"
                : "bg-teal-700/70 border border-teal-500/50")
          }
        >
          <div className="flex flex-col lg:grid lg:grid-cols-2 min-h-[380px]">
            {/* Image */}
            <div className="relative order-1 lg:order-2">
              <Image
                src={active?.visual || "/assets/home_bg.jpg"}
                alt={active?.title || active?.period || "Timeline image"}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-center"
              />
              <div
                className={
                  "absolute inset-0 " +
                  (activeIndex < 2
                    ? "bg-gradient-to-t from-slate-700/90 via-slate-600/40 to-transparent lg:bg-gradient-to-r lg:from-slate-700/80 lg:via-slate-600/30 lg:to-transparent"
                    : activeIndex < 4
                      ? "bg-gradient-to-t from-blue-700/90 via-blue-600/40 to-transparent lg:bg-gradient-to-r lg:from-blue-700/80 lg:via-blue-600/30 lg:to-transparent"
                      : "bg-gradient-to-t from-teal-700/90 via-teal-600/40 to-transparent lg:bg-gradient-to-r lg:from-teal-700/80 lg:via-teal-600/30 lg:to-transparent")
                }
              />
              <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 lg:right-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <span
                    className={
                      "text-white text-xs sm:text-sm px-3 py-1 rounded-full backdrop-blur-sm w-fit " +
                      (activeIndex < 2
                        ? "bg-slate-600/90"
                        : activeIndex < 4
                          ? "bg-blue-600/90"
                          : "bg-teal-600/90")
                    }
                  >
                    {active.period}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  {active.title}
                </h3>
              </div>
            </div>

            {/* Text */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center order-2 lg:order-1">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h4
                    className={
                      "text-xs sm:text-sm font-semibold mb-2 sm:mb-3 uppercase tracking-wider " +
                      (activeIndex < 2
                        ? "text-slate-300"
                        : activeIndex < 4
                          ? "text-blue-300"
                          : "text-teal-300")
                    }
                  >
                    Historical Context
                  </h4>
                  <p className="text-white text-sm sm:text-base leading-relaxed">
                    {active.dramaticText}
                  </p>
                </div>
                <div>
                  <h4
                    className={
                      "text-xs sm:text-sm font-semibold mb-2 sm:mb-3 uppercase tracking-wider " +
                      (activeIndex < 2
                        ? "text-slate-200"
                        : activeIndex < 4
                          ? "text-blue-200"
                          : "text-teal-200")
                    }
                  >
                    Human Story
                  </h4>
                  <p
                    className={
                      "text-sm sm:text-base leading-relaxed italic " +
                      (activeIndex < 2
                        ? "text-slate-100"
                        : activeIndex < 4
                          ? "text-blue-100"
                          : "text-teal-100")
                    }
                  >
                    {active.dramaticText}
                  </p>
                </div>
                <div>
                  <h4
                    className={
                      "text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2 uppercase tracking-wider " +
                      (activeIndex < 2
                        ? "text-yellow-300"
                        : activeIndex < 4
                          ? "text-cyan-300"
                          : "text-emerald-300")
                    }
                  >
                    <span>👶</span>
                    <span>Children&apos;s Perspective</span>
                  </h4>
                  <p
                    className={
                      "text-sm sm:text-base leading-relaxed " +
                      (activeIndex < 2
                        ? "text-yellow-200"
                        : activeIndex < 4
                          ? "text-cyan-200"
                          : "text-emerald-200")
                    }
                  >
                    {active.childPerspective}
                  </p>
                </div>
              </div>

              <div
                className={
                  "flex justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t " +
                  (activeIndex < 2
                    ? "border-slate-500/40"
                    : activeIndex < 4
                      ? "border-blue-500/40"
                      : "border-teal-500/40")
                }
              >
                <button
                  onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                  disabled={activeIndex === 0}
                  className={
                    "flex items-center gap-2 text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 " +
                    (activeIndex < 2
                      ? "text-slate-300 hover:text-white"
                      : activeIndex < 4
                        ? "text-blue-300 hover:text-white"
                        : "text-teal-300 hover:text-white")
                  }
                >
                  <span>Prev</span>
                </button>
                <div className="flex items-center gap-1">
                  {data.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={
                        "w-2 h-2 rounded-full transition-all " +
                        (i === activeIndex
                          ? i < 2
                            ? "bg-slate-400 scale-125"
                            : i < 4
                              ? "bg-blue-400 scale-125"
                              : "bg-teal-400 scale-125"
                          : i < 2
                            ? "bg-slate-600 hover:bg-slate-500"
                            : i < 4
                              ? "bg-blue-600 hover:bg-blue-500"
                              : "bg-teal-600 hover:bg-teal-500")
                      }
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveIndex(Math.min(data.length - 1, activeIndex + 1))}
                  disabled={activeIndex === data.length - 1}
                  className={
                    "flex items-center gap-2 text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 " +
                    (activeIndex < 2
                      ? "text-slate-300 hover:text-white"
                      : activeIndex < 4
                        ? "text-blue-300 hover:text-white"
                        : "text-teal-300 hover:text-white")
                  }
                >
                  <span>Next</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
