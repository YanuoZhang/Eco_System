export default function QuizHotWater() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-red-200/50 shadow overflow-hidden">
      <button className="w-full p-5 text-left hover:bg-red-50/50 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🌡️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Hot Water System</h3>
              <p className="text-sm text-slate-600">Type and usage</p>
            </div>
          </div>
          <i className="ri-arrow-down-s-line text-slate-400 text-xl" />
        </div>
      </button>
    </div>
  );
}
