import PropTypes from "prop-types";
import { useState } from "react";

import App from "./App.jsx";
import { useAppContext } from "./AppContext.jsx";
import CenteredCardLayout from "./components/CenteredCardLayout.jsx";
import { formStatePropType } from "./propTypes";
import ReviewPage from "./ReviewPage.jsx";

export default function MainFormPage({
  formState,
  setFormState,
  resetFormState,
}) {
  const { logout } = useAppContext();
  const [showReview, setShowReview] = useState(false);
  return showReview ? (
    <ReviewPage
      formState={formState}
      onBack={() => setShowReview(false)}
      onSubmitted={() => {
        // Reset form state after submission
        resetFormState();
        setShowReview(false);
      }}
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
  );
}

MainFormPage.propTypes = {
  formState: formStatePropType.isRequired,
  setFormState: PropTypes.func.isRequired,
  resetFormState: PropTypes.func.isRequired,
};
