export default function QuizResultsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800">Your Carbon Footprint (placeholder)</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full"
          >
            ×
          </button>
        </div>
        <p className="text-slate-600">Results and recommendations coming soon.</p>
      </div>
    </div>
  );
}
