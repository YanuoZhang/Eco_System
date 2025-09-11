"use client";

import { useEffect, useRef, useState } from "react";
import ClimateNewsCard from "./ClimateNewsCard";

type NewsItem = {
  id: string;
  headline: string;
  summary: string;
  label: "Critical" | "Update" | "Positive" | "Neutral" | string;
  insight: string;
  image?: string;
  source?: string;
  timestamp?: string;
};

const MOCK_NEWS: NewsItem[] = [
  {
    id: "n1",
    headline: "Australian Children Face 25% Increased Heat Stress Risk at Schools",
    summary:
      "New research shows 5–12 year olds face unprecedented heat‑related health impacts, with 340+ schools lacking adequate cooling systems.",
    label: "Critical",
    insight:
      "Children's developing thermoregulation systems increase vulnerability. Prioritising shade/cooling retrofits prevents majority of incidents.",
    image:
      "https://readdy.ai/api/search-image?query=Australian%20school%20children%20in%20hot%20classroom&width=600&height=300&seq=hero-news-children-1&orientation=landscape",
    source: "Australian Pediatric Research",
    timestamp: "1 hour ago",
  },
  {
    id: "n2",
    headline: "Sydney Heat‑Related Hospital Admissions Surge 400%",
    summary:
      "As temperatures exceed 45°C for the third consecutive day, emergency departments report unprecedented pediatric heat‑stress cases.",
    label: "Critical",
    insight:
      "Pattern mirrors 2019 Black Summer. Urban heat island adds ~25% risk vs rural; targeted cooling centres reduce peak admissions.",
    image:
      "https://readdy.ai/api/search-image?query=Australian%20hospital%20emergency%20room%20heatwave&width=600&height=300&seq=hero-news-health-2&orientation=landscape",
    source: "ABC Health",
    timestamp: "2 hours ago",
  },
  {
    id: "n3",
    headline: "Great Barrier Reef Records Fifth Mass Bleaching Event",
    summary:
      "Marine scientists confirm widespread coral bleaching across 60% of reef systems as ocean temperatures hit record highs.",
    label: "High Risk",
    insight:
      "Event occurred 2 months earlier than historical pattern; recovery probability falls below 20% under current trajectory.",
    image:
      "https://readdy.ai/api/search-image?query=Great%20Barrier%20Reef%20mass%20bleaching&width=600&height=300&seq=hero-news-reef-3&orientation=landscape",
    source: "AIMS Research",
    timestamp: "4 hours ago",
  },
];

export default function LiveClimateNews() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

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

  const NEWS = active
    ? [...MOCK_NEWS, { ...MOCK_NEWS[0], id: "n4" }, { ...MOCK_NEWS[1], id: "n5" }]
    : [];

  return (
    <section id="news-section" ref={ref} aria-label="Live Climate News" className="py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-slate-700/60 text-slate-100 px-4 py-2 rounded-full border border-slate-500/40 mb-4">
            <span>🚨</span>
            <span>Live Climate News</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Latest Australian Climate Impact Updates
          </h3>
          <p className="mt-1 text-slate-200">Headlines with AI insights — tap to flip</p>
        </div>

        {/* Full-bleed horizontal scroller with slight gutters to show ~4.5 cards */}
        <div className="mt-6 w-screen relative left-1/2 -translate-x-1/2 pb-3 px-6 sm:px-8">
          <div
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory w-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {active
              ? NEWS.map((n) => (
                  <ClimateNewsCard
                    key={n.id}
                    headline={n.headline}
                    summary={n.summary}
                    label={n.label}
                    insight={n.insight}
                    image={n.image}
                    source={n.source}
                    timestamp={n.timestamp}
                  />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-64 sm:w-80 h-[380px] sm:h-[420px] flex-shrink-0 snap-start rounded-2xl bg-slate-100/20 border border-slate-500/30 animate-pulse"
                    aria-hidden="true"
                  />
                ))}
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
