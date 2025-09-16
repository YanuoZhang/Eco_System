"use client";

import { useEffect, useRef, useState } from "react";
import ClimateNewsCard from "./ClimateNewsCard";
import { useClimateNews } from "@/hooks/useClimateNews";
import { NewsItem } from "@/services/api";

export default function LiveClimateNews() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const { news, loading, error, lastUpdated } = useClimateNews();

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true);
            io.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Transform API data to match component expectations
  const transformNewsItem = (item: NewsItem) => ({
    ...item,
    insight: item.summary, // Use summary as insight for now
    image: item.image, // Use image from API
  });

  const NEWS = active && !loading && !error ? news.map(transformNewsItem) : [];

  return (
    <section id="news-section" ref={ref} aria-label="Live Climate News" className="py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-slate-700/60 text-slate-100 px-4 py-2 rounded-full border border-slate-500/40 mb-4">
            <span>🚨</span>
            <span>Live Climate News</span>
            {lastUpdated && (
              <span className="text-xs text-slate-300 ml-2">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Latest Australian Climate Impact Updates
          </h3>
          <p className="mt-1 text-slate-200">
            {loading
              ? "Loading AI-curated climate insights..."
              : "Headlines with AI insights — tap to flip"}
          </p>
          {error && <p className="mt-2 text-red-300 text-sm">Error loading news: {error}</p>}
        </div>

        {/* Full-bleed horizontal scroller with slight gutters to show ~4.5 cards */}
        <div className="mt-6 w-screen relative left-1/2 -translate-x-1/2 pb-3 px-6 sm:px-8">
          <div
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory w-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-64 sm:w-80 h-[380px] sm:h-[420px] flex-shrink-0 snap-start rounded-2xl bg-slate-100/20 border border-slate-500/30 animate-pulse"
                  aria-hidden="true"
                />
              ))
            ) : error ? (
              <div className="w-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-red-400 text-4xl mb-4">⚠️</div>
                  <p className="text-red-300 text-lg">Failed to load news</p>
                  <p className="text-slate-400 text-sm mt-2">{error}</p>
                </div>
              </div>
            ) : NEWS.length > 0 ? (
              NEWS.map((n) => (
                <ClimateNewsCard
                  key={n.id}
                  headline={n.headline}
                  summary={n.summary}
                  label={n.label}
                  insight={n.insight}
                  image={n.image}
                  source={n.source}
                  timestamp={n.timestamp}
                  link={n.link}
                />
              ))
            ) : (
              <div className="w-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-slate-400 text-4xl mb-4">📰</div>
                  <p className="text-slate-300 text-lg">No news available</p>
                  <p className="text-slate-400 text-sm mt-2">Check back later for updates</p>
                </div>
              </div>
            )}
          </div>
          <style jsx>{`
            .flex::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>

        <div className="text-center text-slate-300 text-xs">
          ↔ Scroll to see more news • Click cards for AI analysis
        </div>
      </div>
    </section>
  );
}
