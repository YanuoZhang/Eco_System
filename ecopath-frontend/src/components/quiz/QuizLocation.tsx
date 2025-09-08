export default function QuizLocation() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow border border-orange-200/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
          <span className="text-white">📍</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Select Your Location</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-sm text-slate-600 mb-2">State/Territory</label>
          <select className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700">
            <option>Choose your state...</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-slate-600 mb-2">City (optional)</label>
          <input className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-700" />
        </div>
      </div>
    </div>
  );
}
