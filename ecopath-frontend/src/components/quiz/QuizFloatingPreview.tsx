export default function QuizFloatingPreview({
  valueKgYear,
  timeUnit = "year",
  onOpen,
}: {
  valueKgYear?: number;
  timeUnit?: "month" | "quarter" | "year";
  onOpen: () => void;
}) {
  if (!valueKgYear || valueKgYear <= 0) return null;
  const scale = timeUnit === "month" ? 12 : timeUnit === "quarter" ? 4 : 1;
  const shown = valueKgYear / scale;
  const unitLabel = timeUnit;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onOpen}
        className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-bold px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{ boxShadow: "0 10px 40px rgba(255, 107, 0, 0.4), 0 0 30px rgba(255, 165, 0, 0.3)" }}
      >
        <div className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">📊</span>
            <span className="text-lg font-bold">
              {shown.toFixed(1)} kg CO₂/{unitLabel}
            </span>
          </div>
          <div className="text-xs opacity-90">Click for full analysis →</div>
        </div>
      </button>
    </div>
  );
}
