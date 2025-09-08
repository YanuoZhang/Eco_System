export default function QuizFloatingPreview({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onOpen}
        className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-bold px-6 py-4 rounded-2xl shadow-2xl transition-all hover:scale-105 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <span>Open Results (placeholder)</span>
        </div>
      </button>
    </div>
  );
}
