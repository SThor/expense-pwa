import { useLocation, useNavigate } from "react-router-dom";
import ReviewSection from "./components/ReviewSection";
import CenteredCardLayout from "./components/CenteredCardLayout";

export default function ReviewPage({
  formState,
  onBack,
  onSubmit,
  result // generic result
}) {
  // If formState is not passed as prop, try to get it from location.state
  const location = useLocation();
  const navigate = useNavigate();
  const state = formState || (location.state && location.state.formState);
  if (!state) {
    // If no state, redirect to main form
    navigate("/", { replace: true });
    return null;
  }
  return (
    <CenteredCardLayout>
        <div className="flex justify-between mb-4">
            <button onClick={onBack || (() => navigate("/"))} className="text-sky-600 underline">Back to Edit</button>
            <a href="/login" className="text-sky-600 underline">Logout</a>
        </div>
        <ReviewSection {...state} />
        {result && (
            <div
            className="text-sm mt-2"
            style={{ color: result.startsWith("✅") ? "green" : "red" }}
            >
            {result}
            </div>
        )}
        <button
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full mt-4"
            onClick={onSubmit}
        >
            Confirm & Submit
        </button>
    </CenteredCardLayout>
  );
}
