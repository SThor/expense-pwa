import { useNavigate } from "react-router-dom";
import { useAppContext } from "./AppContext";
import { getAccountIdByName } from "./utils/ynabUtils";
import { addSettleUpTransaction } from "./api/settleup";
import ReviewSection from "./components/ReviewSection";
import CenteredCardLayout from "./components/CenteredCardLayout";
import { useState } from "react";

export default function ReviewPage({
  formState,
  onBack,
  onSubmit,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const {
    ynabAPI,
    budgetId,
    settleUpToken,
    settleUpUserId,
    settleUpLoading,
    settleUpError,
    accounts,
  } = useAppContext();

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
      const boursoTransferPayeeId = "eabe1e60-fa92-40f7-8636-5c8bcbf1404a";
      const transaction = {
        account_id: swileAccountId,
        date: new Date().toISOString().slice(0, 10),
        amount: formState.swileMilliunits,
        payee_id: formState.payeeId || null,
        payee_name: !formState.payeeId ? formState.payee : undefined,
        category_id: null,
        memo: formState.description,
        approved: true,
        subtransactions: [
          {
            amount: formState.amountMilliunits,
            category_id: formState.categoryId,
            memo: formState.description,
            payee_id: formState.payeeId || null,
          },
          {
            amount: transferInflowMilliunits,
            payee_id: boursoTransferPayeeId,
            transfer_account_id: boursoAccountId,
            memo: "Bourso completion",
          },
        ],
      };
      try {
        setLoading(true);
        await ynabAPI.transactions.createTransaction(budgetId, { transaction });
        setResult("✅ YNAB split transaction sent!");
      } catch (err) {
        setResult("YNAB API error: " + (err?.message || err));
      } finally {
        setLoading(false);
      }
      return;
    }
    // Single-account transaction
    let accountId = null;
    if (formState.account.bourso)
      accountId = getAccountIdByName(accounts, "Boursorama");
    else if (formState.account.swile) accountId = getAccountIdByName(accounts, "Swile");
    else accountId = getAccountIdByName(accounts, "Boursorama");
    if (!accountId) {
      setResult("No matching YNAB account found for the selected button.");
      return;
    }
    const transaction = {
      account_id: accountId,
      date: new Date().toISOString().slice(0, 10),
      amount: formState.amountMilliunits,
      payee_id: formState.payeeId || null,
      payee_name: !formState.payeeId ? formState.payee : undefined,
      category_id: formState.categoryId,
      memo: formState.description,
      approved: true,
    };
    try {
      setLoading(true);
      const res = await ynabAPI.transactions.createTransaction(budgetId, { transaction });
      setResult("✅ YNAB transaction sent!");
    } catch (err) {
      setResult("YNAB API error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSettleUpSubmit() {
    setResult("");
    if (!settleUpToken || !formState.settleUpTestGroup?.groupId || formState.amountMilliunits === 0 || !formState.settleUpPayerId || !formState.settleUpForWhomIds?.length) {
      setResult("❌ Please fill all required fields before submitting.");
      return;
    }
    const amount = (-formState.amountMilliunits / 1000).toFixed(2);
    const now = Date.now();
    const tx = {
      category: formState.settleUpCategory === "∅" ? "" : formState.settleUpCategory,
      currencyCode: formState.settleUpCurrency || "EUR",
      dateTime: now,
      items: [
        {
          amount: amount,
          forWhom: formState.settleUpForWhomIds.map((id) => ({ memberId: id, weight: "1" })),
        },
      ],
      purpose: formState.payee + (formState.description ? ` - ${formState.description}` : ""),
      type: "expense",
      whoPaid: [{ memberId: formState.settleUpPayerId, weight: "1" }],
      fixedExchangeRate: false,
      exchangeRates: undefined,
      receiptUrl: undefined,
    };
    try {
      setLoading(true);
      const data = await addSettleUpTransaction(settleUpToken, formState.settleUpTestGroup.groupId, tx);
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
    if (onSubmit) onSubmit();
  }

  return (
    <CenteredCardLayout>
      <div className="flex justify-between mb-4">
        <button onClick={onBack || (() => navigate("/"))} className="text-sky-600 underline">Back to Edit</button>
        <a href="/login" className="text-sky-600 underline">Logout</a>
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
        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full mt-4"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Confirm & Submit"}
      </button>
    </CenteredCardLayout>
  );
}
