import EuroLoadingSpinner from "./EuroLoadingSpinner.jsx";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center">
        <EuroLoadingSpinner size="w-12 h-12" className="mb-4" />
        <p className="text-gray-600 text-sm animate-pulse">
          Loading your expense entry app...
        </p>
      </div>
    </div>
  );
}
