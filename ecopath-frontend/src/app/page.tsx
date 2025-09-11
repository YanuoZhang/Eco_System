import LiveClimateNews from "@/components/news/LiveClimateNews";
import Hero from "@/components/home/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#244959] to-[#335566]">
      {/* Hero background (aligned with refer style) */}
      <section className="pt-16 sm:pt-20 pb-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/assets/home_bg.jpg"
            alt="Climate landscape background"
            className="w-full h-full object-cover object-center"
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
      </main>
    </div>
  );
}
