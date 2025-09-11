"use client";

import { useState } from "react";

type ClimateNewsCardProps = {
  headline: string;
  summary: string;
  label: "Critical" | "High Risk" | "Warning" | "Update" | "Positive" | "Neutral" | string;
  insight: string;
  image?: string;
  source?: string;
  timestamp?: string;
};

export function ClimateNewsCard({
  headline,
  summary,
  label,
  insight,
  image,
  source,
  timestamp,
}: ClimateNewsCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={flipped}
      aria-label={flipped ? "Show headline" : "Show AI insight"}
      onClick={() => setFlipped((v) => !v)}
      className="relative w-64 sm:w-80 h-[380px] sm:h-[420px] flex-shrink-0 snap-start [perspective:1000px] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div
        className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* front */}
        <div className="absolute inset-0 rounded-2xl bg-slate-700/85 backdrop-blur border border-slate-500/40 overflow-hidden [backface-visibility:hidden]">
          <div className="relative h-36 sm:h-40">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={headline}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-slate-600" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-700/85 via-slate-600/40 to-transparent" />
            <div
              className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                label === "Critical"
                  ? "bg-red-500/80 text-red-100"
                  : label === "High Risk"
                    ? "bg-orange-500/80 text-orange-100"
                    : "bg-yellow-500/80 text-yellow-100"
              }`}
            >
              {label}
            </div>
            <div className="absolute top-2 right-2 w-7 h-7 bg-blue-600/80 rounded-full border border-blue-400/50 flex items-center justify-center">
              <span className="text-white text-xs">🤖</span>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <h4 className="text-white font-bold text-sm sm:text-base line-clamp-2 leading-tight">
              {headline}
            </h4>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 line-clamp-3">{summary}</p>
            <div className="flex justify-between items-center text-xs text-slate-400 mt-3">
              <span className="truncate">{source}</span>
              <span className="flex-shrink-0">{timestamp}</span>
            </div>
            <div className="mt-3 text-center">
              <span className="text-xs text-slate-300 bg-slate-600/60 px-2 py-1 rounded-full border border-slate-400/30">
                Click for AI Analysis
              </span>
            </div>
          </div>
        </div>

        {/* back (match refer: blue-purple gradient card) */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-700/85 to-blue-700/85 text-white p-4 sm:p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] border border-indigo-500/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤖</span>
            <h4 className="font-bold">AI Insight Analysis</h4>
          </div>
          <p className="text-indigo-100 leading-relaxed text-sm mb-4">{insight}</p>
          <div className="bg-indigo-800/60 rounded-lg p-3 border border-indigo-600/40">
            <div className="text-indigo-200 font-semibold text-xs mb-1">ORIGINAL HEADLINE</div>
            <div className="text-white text-sm font-medium line-clamp-2">{headline}</div>
          </div>
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="inline-block text-xs text-indigo-300 bg-indigo-800/60 px-3 py-1 rounded-full border border-indigo-600/40">
              Click to return
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default ClimateNewsCard;
