export default function LoadingSpinner() {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center gap-3 text-white">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <span>Loading data...</span>
      </div>
    </div>
  );
}
