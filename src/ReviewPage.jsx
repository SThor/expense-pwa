import PropTypes from "prop-types";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  addSettleUpTransaction,
  fetchSettleUpPermissions,
} from "./api/settleup";
import { useAppContext } from "./AppContext.jsx";
import { useAuth } from "./AuthProvider.jsx";
import CenteredCardLayout from "./components/CenteredCardLayout.jsx";
import ReviewSection from "./components/ReviewSection.jsx";
import Stepper from "./components/Stepper.jsx";
import SyncMessages from "./components/SyncMessages.jsx";
import { BOURSO_TRANSFER_PAYEE_ID } from "./constants.js";
import { useSyncStateMachine } from "./hooks/useSyncStateMachine.js";
import { formStatePropType } from "./propTypes.js";
import { formatYYYYMMDDLocal } from "./utils/dateUtils";
import { getAccountIdByName } from "./utils/ynabUtils";

export default function ReviewPage({ formState, onBack, onSubmitted }) {
  const navigate = useNavigate();
  const { ynabAPI, budgetId, accounts } = useAppContext();
  const { token, user } = useAuth();

  // Helper function to create base transaction object
  const createBaseTransaction = useCallback(
    (accountId, amount) => {
      return {
        account_id: accountId,
        date: formatYYYYMMDDLocal(formState.date),
        amount: amount,
        payee_id: formState.payeeId || null,
        payee_name: !formState.payeeId ? formState.payee : undefined,
        category_id: formState.categoryId,
        memo: formState.description,
        approved: true,
      };
    },
    [formState],
  );

  // Helper function to execute YNAB API call
  const executeYnabTransaction = useCallback(
    async (transaction, successMessage) => {
      const res = await ynabAPI.transactions.createTransaction(budgetId, {
        transaction,
      });
      return successMessage + "\n" + JSON.stringify(res, null, 2);
    },
    [ynabAPI, budgetId],
  );

  const handleYnabSubmit = useCallback(async () => {
    if (!ynabAPI || !budgetId) {
      throw new Error("YNAB not configured.");
    }

    // Split transaction logic
    if (formState.account.swile && formState.account.bourso) {
      const swileAccountId = getAccountIdByName(accounts, "Swile");
      const boursoAccountId = getAccountIdByName(accounts, "Boursorama");

      if (!swileAccountId || !boursoAccountId) {
        throw new Error("No matching YNAB account found for Swile or Bourso.");
      }

      const transferInflowMilliunits =
        formState.swileMilliunits - formState.amountMilliunits;

      // If Swile covers the full amount, create a simple transaction
      if (transferInflowMilliunits === 0) {
        const transaction = createBaseTransaction(
          swileAccountId,
          formState.amountMilliunits,
        );
        return await executeYnabTransaction(transaction, "✅ YNAB transaction sent!");
      }

      // Create split transaction
      const transaction = {
        ...createBaseTransaction(swileAccountId, formState.swileMilliunits),
        category_id: null, // Override for split transactions
        subtransactions: [
          {
            amount: formState.amountMilliunits,
            category_id: formState.categoryId,
            memo: formState.description,
            payee_id: formState.payeeId || null,
          },
          {
            amount: transferInflowMilliunits,
            payee_id: BOURSO_TRANSFER_PAYEE_ID,
            transfer_account_id: boursoAccountId,
            memo: "Bourso completion",
          },
        ],
      };

      return await executeYnabTransaction(
        transaction,
        "✅ YNAB split transaction sent!",
      );
    }

    // Single-account transaction
    const accountId = formState.account.bourso
      ? getAccountIdByName(accounts, "Boursorama")
      : formState.account.swile
        ? getAccountIdByName(accounts, "Swile")
        : getAccountIdByName(accounts, "Boursorama"); // Default fallback

    if (!accountId) {
      throw new Error("No matching YNAB account found for the selected button.");
    }

    const transaction = createBaseTransaction(
      accountId,
      formState.amountMilliunits,
    );
    return await executeYnabTransaction(transaction, "✅ YNAB transaction sent!");
  }, [ynabAPI, budgetId, accounts, formState, createBaseTransaction, executeYnabTransaction]);

  const handleSettleUpSubmit = useCallback(async () => {
    if (
      !token ||
      !formState.settleUpGroup?.groupId ||
      formState.amountMilliunits === 0 ||
      !formState.settleUpPayerId ||
      !formState.settleUpMembers?.length
    ) {
      console.warn("[ReviewPage] Missing required fields for SettleUp submit");
      throw new Error("❌ Please fill all required fields before submitting.");
    }
    const permissions = await fetchSettleUpPermissions(
      token,
      formState.settleUpGroup.groupId,
    );
    if (!permissions[user.uid] || permissions[user.uid].level < 20) {
      console.warn("[ReviewPage] Insufficient permissions for user:", user.uid);
      throw new Error("❌ You do not have permission to submit this transaction.");
    }
    const amount = (-formState.amountMilliunits / 1000).toFixed(2);
    const tx = {
      category:
        formState.settleUpCategory === "∅"
          ? undefined
          : formState.settleUpCategory,
      currencyCode: formState.settleUpCurrency || "EUR",
      dateTime: formState.date.getTime(),
      items: [
        {
          amount: amount,
          forWhom: formState.settleUpMembers.map((member) => ({
            memberId: member.id,
            weight: (member.defaultWeight || "1").toString(),
          })),
        },
      ],
      purpose:
        formState.payee +
        (formState.description ? ` - ${formState.description}` : ""),
      type: "expense",
      whoPaid: [{ memberId: formState.settleUpPayerId, weight: "1" }],
      exchangeRates: [],
      fixedExchangeRate: true,
    };
    const data = await addSettleUpTransaction(
      token,
      formState.settleUpGroup.groupId,
      tx,
    );
    if (data && data.name) {
      return "✅ SettleUp transaction sent!";
    } else {
      throw new Error("Error adding transaction: " + JSON.stringify(data));
    }
  }, [token, user, formState]);

  // Initialize state machine
  const {
    state,
    context,
    isLoading,
    isSuccess,
    isError,
    submit,
  } = useSyncStateMachine(handleYnabSubmit, handleSettleUpSubmit, { debug: false });

  async function handleSubmit() {
    submit(formState.target.ynab, formState.target.settleup);
  }

  // Call onSubmitted when we reach a final state
  if ((isSuccess || isError) && onSubmitted && state !== "idle") {
    // Use a ref or effect to call onSubmitted only once
    // For now, we'll let the parent handle this
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

      {/* Stepper visualization */}
      {(isLoading || isSuccess || isError) && (
        <Stepper
          currentState={state}
          enableYNAB={formState.target.ynab}
          enableSettleUp={formState.target.settleup}
        />
      )}

      {/* Sync messages */}
      <SyncMessages messages={context.messages} errors={context.errors} />

      <button
        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-sm w-full mt-4"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Confirm & Submit"}
      </button>
    </CenteredCardLayout>
  );
}

ReviewPage.propTypes = {
  formState: formStatePropType.isRequired,
  onBack: PropTypes.func,
  onSubmitted: PropTypes.func,
};
