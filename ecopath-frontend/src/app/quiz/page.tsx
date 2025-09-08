"use client";

import { useEffect, useState } from "react";
import QuizHero from "@/components/quiz/QuizHero";
import QuizElectricity from "@/components/quiz/QuizElectricity";
import QuizHotWater from "@/components/quiz/QuizHotWater";
import QuizAppliances from "@/components/quiz/QuizAppliances";
import QuizTransport from "@/components/quiz/QuizTransport";
import QuizFloatingPreview from "@/components/quiz/QuizFloatingPreview";
import QuizResultsModal from "@/components/quiz/QuizResultsModal";
import { ApiService, StateData } from "@/services/api";

export default function QuizPage() {
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string>("VIC");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    ApiService.getStates()
      .then((list) => setStates(list))
      .catch(() => setStates([]));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-green-50">
      <QuizHero states={states} selectedState={selectedState} onStateChange={setSelectedState} />
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
