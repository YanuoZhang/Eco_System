"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

// Removed unused Period type to satisfy linter

type StoryStep = {
  id: number;
  title: string;
  period: string;
  description: string;
  dramaticText: string;
  childPerspective: string;
  visual: string;
};

const STORY_STEPS: StoryStep[] = [
  {
    id: 1,
    title: "Industrial Revolution Begins",
    period: "1880-1950",
    description:
      "Humanity discovers fossil fuels. Coal-powered factories transform society, but the atmosphere begins to change.",
    dramaticText:
      "The machines awakened. Steam and steel promised progress, but the atmosphere began remembering every smokestack.",
    childPerspective:
      "Children of this era watched the first smokestacks rise, unknowing that these tall towers would forever change the world.",
    visual:
      "https://readdy.ai/api/search-image?query=Industrial%20revolution%20scene%20with%20steam-powered%20factories%2C%20coal%20smokestacks%20belching%20black%20smoke%20into%20clear%20sky%2C0workers%20in%20early%20industrial%20setting%2C%20children%20watching%20from%20distance%2C%20dramatic%20contrast%20between%20human%20progress%20and%20environmental%20impact&width=600&height=300&seq=story-industrial-1&orientation=landscape",
  },
  {
    id: 2,
    title: "The Great Acceleration",
    period: "1950-1990",
    description:
      "Post-war prosperity accelerates consumption. Cars, planes, and mass production reshape the world. Scientists first warn of greenhouse effects.",
    dramaticText:
      "We built a world of abundance, not knowing we were writing stories of scarcity for our children.",
    childPerspective:
      "Baby boomers grew up believing progress meant prosperity, while their children would inherit a warming world.",
    visual:
      "https://readdy.ai/api/search-image?query=1950s%20suburban%20boom%20with%20cars%2C%20highways%2C%20factories%2C%20families%20with%20children%20enjoying%20modern%20lifestyle%20contrasted%20with%20early%20climate%20scientists%20studying%20atmospheric%20data%2C%20showing%20the%20acceleration%20of%20human%20impact&width=600&height=300&seq=story-acceleration-2&orientation=landscape",
  },
  {
    id: 3,
    title: "First Climate Signals",
    period: "1990-2010",
    description:
      "Extreme weather becomes noticeable. First IPCC reports warn of dangerous warming. Kyoto Protocol attempts global action.",
    dramaticText:
      "The Earth began to speak. Hurricanes grew stronger, glaciers retreated, but the world was still learning to listen.",
    childPerspective:
      "Millennial children witnessed the first climate documentaries, learning their planet was in danger.",
    visual:
      "https://readdy.ai/api/search-image?query=Early%20climate%20change%20impacts%20showing%20melting%20glaciers%2C%20stronger%20hurricanes%2C%20children%20watching%20environmental%20documentaries%20in%20classrooms%2C%20climate%20scientists%20presenting%20research%2C%20growing%20environmental%20awareness%20among%20young%20people&width=600&height=300&seq=story-signals-3&orientation=landscape",
  },
  {
    id: 4,
    title: "Climate Crisis Arrives",
    period: "2010-2020",
    description:
      "Australian bushfires, record heatwaves, and global protests mark climate emergency. Young voices demand action.",
    dramaticText:
      "The future knocked on our door through smoke and flames. A generation stood up, refusing to inherit a broken world.",
    childPerspective:
      "Gen Z children led school strikes, demanding adults act on climate change before it was too late.",
    visual:
      "https://readdy.ai/api/search-image?query=Climate%20crisis%20scene%20showing%20Australian%20bushfires%2C%20children%20and%20teenagers%20in%20climate%20protests%20holding%20signs%2C%20school%20climate%20strikes%2C%20youngactivists%20speakingat%20rallies%2C%20dramatic%20skywith%20smoke%20and%20flames&width=600&height=300&seq=story-crisis-4&orientation=landscape",
  },
  {
    id: 5,
    title: "The Crossroads Moment",
    period: "2020-2030",
    description:
      "We stand at a crossroads. Technology offers solutions, but time is running short. Every action taken today shapes the next century.",
    dramaticText:
      "This is our moment. The story of what happens next is still being written - through every choice we make today.",
    childPerspective:
      "Today&apos;s children will live the consequences of our choices. Their future depends on the actions we take now.",
    visual:
      "https://readdy.ai/api/search-image?query=Hopeful%20future%20scene%20showing%20renewable%20energy%20farms%2C%20electric%20vehicles%2C%20green%20cities%2C%20children%20playing%20in%20clean%20environments%2C%20families%20taking%20climate%20action%2C%20solar%20panels%20and%20wind%20turbines%2C%20sustainable%20lifestyle%2C%20bright%20future%20possibility&width=600&height=300&seq=story-choice-5&orientation=landscape",
  },
];

export default function ClimateTimeline() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Note: previously used IntersectionObserver to lazy-reveal; now default to visible

  const active = useMemo(() => STORY_STEPS[activeIndex], [activeIndex]);

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
              {STORY_STEPS.map((step, index) => (
                <button
                  key={step.id}
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
                src={active.visual}
                alt={active.title}
                fill
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
                    {active.description}
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
                  {STORY_STEPS.map((_, i) => (
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
                  onClick={() => setActiveIndex(Math.min(STORY_STEPS.length - 1, activeIndex + 1))}
                  disabled={activeIndex === STORY_STEPS.length - 1}
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
