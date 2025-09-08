export default function QuizAppliances() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow overflow-hidden">
      <button className="w-full p-5 text-left hover:bg-purple-50/50 transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🧺</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Common Appliances</h3>
              <p className="text-sm text-slate-600">Weekly used devices</p>
            </div>
          </div>
          <i className="ri-arrow-down-s-line text-slate-400 text-xl" />
        </div>
      </button>
    </div>
  );
}
