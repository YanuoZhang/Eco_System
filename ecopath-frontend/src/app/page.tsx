import LiveClimateNews from "@/components/news/LiveClimateNews";
import Hero from "@/components/home/Hero";
import ClimateTimeline from "@/components/timeline/ClimateTimeline";
// For client-side verification of API calls, we no longer fetch timeline in SSR.
import CallToAction from "@/components/home/CallToAction";
import BottomFooter from "@/components/home/BottomFooter";
import Image from "next/image";

export default async function Home() {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #3b6a7a 0%, #3b6a7a 50%, rgb(111, 145, 162) 75%, rgb(52, 151, 142) 90%)",
      }}
    >
      {/* Hero background (aligned with refer style) */}
      <section className="pt-16 sm:pt-20 pb-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/home_bg.jpg"
            alt="Climate landscape background"
            fill={true}
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#244959]/80 via-[#2b5264]/60 to-[#3b6a7a]/30" />
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-slate-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <Hero />
      </section>

      <main className="mx-auto max-w-6xl px-6 pb-10 sm:pb-12">
        {/* Climate section only (aligned with refer background style) */}
        <LiveClimateNews />

        {/* Info Page Guide Section */}
        <section className="relative my-6 py-8 border-y border-slate-200/30">
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="rounded-xl bg-slate-700/40 backdrop-blur-sm border border-slate-400/20 px-5 sm:px-8 py-5 text-center">
              <p className="text-slate-200">
                Want to explore detailed climate data and evidence analysis? Check out our{" "}
                <a
                  href="/info"
                  className="text-blue-200 hover:text-cyan-200 underline cursor-pointer transition-colors"
                >
                  comprehensive data analysis page
                </a>{" "}
                for emissions breakdown, energy structure, and environmental indicators.
              </p>
            </div>
          </div>
        </section>

        <ClimateTimeline />
      </main>
      <CallToAction />
      <BottomFooter />
    </div>
  );
}
