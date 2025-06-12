import {useState} from "react";
import { useAppContext } from "./AppContext";
import App from "./App";
import CenteredCardLayout from "./components/CenteredCardLayout";
import ReviewPage from "./ReviewPage";

export default function MainFormPage({ formState, setFormState, onSubmit }) {
  const { logout } = useAppContext();
  const [showReview, setShowReview] = useState(false);
  const [result, setResult] = useState(""); // generic result
  return (
    showReview ? (
      <ReviewPage
        formState={formState}
        onBack={() => setShowReview(false)}
        onSubmitted={() => setShowReview(false)}
        result={result}
      />
    ) : (
      <CenteredCardLayout>
      <div className="flex justify-between mb-4">
        <span /> {/* Stretch to fill space */}
        <button
          className="text-sky-600 underline bg-transparent border-none cursor-pointer p-0"
          onClick={logout}
        >
          Logout
        </button>
      </div>
      <App
        onSubmit={() => setShowReview(true)}
        formState={formState}
        setFormState={setFormState}
      />
    </CenteredCardLayout>
    )   
  );
}
