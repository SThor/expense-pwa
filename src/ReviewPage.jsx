import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addSettleUpTransaction,
  fetchSettleUpPermissions,
} from "./api/settleup";
import { useAppContext } from "./AppContext.jsx";
import { useAuth } from "./AuthProvider.jsx";
import CenteredCardLayout from "./components/CenteredCardLayout.jsx";
import ReviewSection from "./components/ReviewSection.jsx";
import { BOURSO_TRANSFER_PAYEE_ID } from "./constants.js";
import { formStatePropType } from "./propTypes.js";
import { getAccountIdByName } from "./utils/ynabUtils";

export default function ReviewPage({ formState, onBack, onSubmitted }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const { ynabAPI, budgetId, accounts } = useAppContext();
  const { token, user } = useAuth();

  // Helper function to create base transaction object
  function createBaseTransaction(accountId, amount) {
    return {
      account_id: accountId,
      date: new Date().toISOString().slice(0, 10),
      amount: amount,
      payee_id: formState.payeeId || null,
      payee_name: !formState.payeeId ? formState.payee : undefined,
      category_id: formState.categoryId,
      memo: formState.description,
      approved: true,
    };
  }

  // Helper function to execute YNAB API call
  async function executeYnabTransaction(transaction, successMessage) {
    try {
      setLoading(true);
      const res = await ynabAPI.transactions.createTransaction(budgetId, {
        transaction,
      });
      setResult(successMessage + "\n" + JSON.stringify(res, null, 2));
    } catch (err) {
      setResult("YNAB API error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleYnabSubmit() {
    if (!ynabAPI || !budgetId) {
      setResult("YNAB not configured.");
      return;
    }

    // Split transaction logic
    if (formState.account.swile && formState.account.bourso) {
      const swileAccountId = getAccountIdByName(accounts, "Swile");
      const boursoAccountId = getAccountIdByName(accounts, "Boursorama");
      
      if (!swileAccountId || !boursoAccountId) {
        setResult("No matching YNAB account found for Swile or Bourso.");
        return;
      }

      const transferInflowMilliunits = formState.swileMilliunits - formState.amountMilliunits;

      // If Swile covers the full amount, create a simple transaction
      if (transferInflowMilliunits === 0) {
        const transaction = createBaseTransaction(swileAccountId, formState.amountMilliunits);
        await executeYnabTransaction(transaction, "✅ YNAB transaction sent!");
        return;
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
      
      await executeYnabTransaction(transaction, "✅ YNAB split transaction sent!");
      return;
    }

    // Single-account transaction
    const accountId = formState.account.bourso 
      ? getAccountIdByName(accounts, "Boursorama")
      : formState.account.swile 
        ? getAccountIdByName(accounts, "Swile")
        : getAccountIdByName(accounts, "Boursorama"); // Default fallback

    if (!accountId) {
      setResult("No matching YNAB account found for the selected button.");
      return;
    }

    const transaction = createBaseTransaction(accountId, formState.amountMilliunits);
    await executeYnabTransaction(transaction, "✅ YNAB transaction sent!");
  }

  async function handleSettleUpSubmit() {
    setResult("");
    if (
      !token ||
      !formState.settleUpGroup?.groupId ||
      formState.amountMilliunits === 0 ||
      !formState.settleUpPayerId ||
      !formState.settleUpMembers?.length
    ) {
      console.warn("[ReviewPage] Missing required fields for SettleUp submit");
      setResult("❌ Please fill all required fields before submitting.");
      return;
    }
    const permissions = await fetchSettleUpPermissions(
      token,
      formState.settleUpGroup.groupId,
    );
    if (!permissions[user.uid] || permissions[user.uid].level < 20) {
      console.warn("[ReviewPage] Insufficient permissions for user:", user.uid);
      setResult("❌ You do not have permission to submit this transaction.");
      return;
    }
    const amount = (-formState.amountMilliunits / 1000).toFixed(2);
    const now = Date.now();
    const tx = {
      category:
        formState.settleUpCategory === "∅"
          ? undefined
          : formState.settleUpCategory,
      currencyCode: formState.settleUpCurrency || "EUR",
      dateTime: now,
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
    try {
      setLoading(true);
      const data = await addSettleUpTransaction(
        token,
        formState.settleUpGroup.groupId,
        tx,
      );
      if (data && data.name) {
        setResult("✅ SettleUp transaction sent!");
      } else {
        setResult("Error adding transaction: " + JSON.stringify(data));
      }
    } catch (e) {
      setResult("Error adding transaction: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (formState.target.ynab) await handleYnabSubmit();
    if (formState.target.settleup) await handleSettleUpSubmit();
    if (onSubmitted) onSubmitted();
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
      {result && (
        <div
          className="text-sm mt-2"
          style={{ color: result.startsWith("✅") ? "green" : "red" }}
        >
          {result}
        </div>
      )}
      <button
        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-sm w-full mt-4"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Confirm & Submit"}
      </button>
    </CenteredCardLayout>
  );
}

ReviewPage.propTypes = {
  formState: formStatePropType.isRequired,
  onBack: PropTypes.func,
  onSubmitted: PropTypes.func,
};
