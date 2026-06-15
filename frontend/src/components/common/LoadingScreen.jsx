// LoadingScreen
export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg animate-pulse">D</div>
        <p className="text-sm text-gray-500 font-medium">Loading DormEase...</p>
      </div>
    </div>
  );
}
