"use client";

import QuizHero from "@/components/quiz/QuizHero";
import QuizElectricity from "@/components/quiz/QuizElectricity";
import QuizHotWater from "@/components/quiz/QuizHotWater";
import QuizAppliances from "@/components/quiz/QuizAppliances";
import QuizTransport from "@/components/quiz/QuizTransport";
import QuizFloatingPreview from "@/components/quiz/QuizFloatingPreview";
import QuizResultsModal from "@/components/quiz/QuizResultsModal";
import { useState } from "react";

export default function QuizPage() {
  // Minimal placeholder state; real logic to be added later
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-green-50">
      <QuizHero />
      <section className="py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <QuizElectricity />
          <QuizHotWater />
          <QuizAppliances />
          <QuizTransport />
        </div>
      </section>
      <QuizFloatingPreview onOpen={() => setShowResults(true)} />
      <QuizResultsModal open={showResults} onClose={() => setShowResults(false)} />
    </div>
  );
}
