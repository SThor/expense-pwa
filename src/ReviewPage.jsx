import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

import { useAppContext } from "./AppContext.jsx";
import { useAuth } from "./AuthProvider.jsx";
import ApiSyncStatus from "./components/ApiSyncStatus.jsx";
import CenteredCardLayout from "./components/CenteredCardLayout.jsx";
import ReviewSection from "./components/ReviewSection.jsx";
import { API_STATUS, useApiSync } from "./hooks/useApiSync";
import { formStatePropType } from "./propTypes.js";

export default function ReviewPage({ formState, onBack, onSubmitted }) {
  const navigate = useNavigate();
  const { ynabAPI, budgetId, accounts } = useAppContext();
  const { token, user } = useAuth();

  const { ynab, settleup, anyInFlight, startSync, retryFetch, retryEnter } =
    useApiSync({ ynabAPI, budgetId, accounts, token, user });

  async function handleConfirmSubmit() {
    const results = await startSync(formState);

    const allTargetedSucceeded =
      (!formState.target.ynab || results.ynab === API_STATUS.SUCCESS) &&
      (!formState.target.settleup || results.settleup === API_STATUS.SUCCESS);

    if (allTargetedSucceeded && onSubmitted) onSubmitted();
  }

  function handleRetryYnab() {
    if (ynab.status === API_STATUS.FETCH_ERROR) retryFetch("ynab");
    else retryEnter("ynab");
  }

  function handleRetrySettleup() {
    if (settleup.status === API_STATUS.FETCH_ERROR) retryFetch("settleup");
    else retryEnter("settleup");
  }

  return (
    <CenteredCardLayout>
      <div className="flex justify-between mb-4">
        <button
          onClick={onBack || (() => navigate("/"))}
          className="text-sky-600 underline"
        >
          Back to Edit
        </button>
        <a href="/login" className="text-sky-600 underline">
          Logout
        </a>
      </div>
      <ReviewSection {...formState} />
      <ApiSyncStatus
        ynab={ynab}
        settleup={settleup}
        onRetryYnab={handleRetryYnab}
        onRetrySettleup={handleRetrySettleup}
      />
      <button
        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-sm w-full mt-4"
        onClick={handleConfirmSubmit}
        disabled={anyInFlight}
      >
        {anyInFlight ? "Submitting…" : "Confirm & Submit"}
      </button>
    </CenteredCardLayout>
  );
}

ReviewPage.propTypes = {
  formState: formStatePropType.isRequired,
  onBack: PropTypes.func,
  onSubmitted: PropTypes.func,
};
