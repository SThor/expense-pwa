import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";

import {
  fetchSettleUpMembers,
  fetchSettleUpTransactions,
  addSettleUpTransaction,
  fetchSettleUpPermissions,
  fetchSettleUpUserGroupNode,
} from "../api/settleup.js";
import { useAppContext } from "../AppContext.jsx";
import { DEFAULT_CURRENCY, DEBOUNCE_AUTOFILL } from "../constants";
import { getMostCommonCategoryFromTransactions } from "../utils/settleupUtils";

import AmountInput from "./AmountInput.jsx";
import EmojiCategoryButton from "./EmojiCategoryButton.jsx";

export default function SettleUpApiTestForm({ setResult }) {
  const {
    settleUpToken: token,
    settleUpUserId: userId,
    settleUpLoading: loadingToken,
    settleUpError: tokenError,
  } = useAppContext();
  const [testGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [amountMilliunits, setAmountMilliunits] = useState(0);
  const [desc, setDesc] = useState("");
  const [payerId, setPayerId] = useState("");
  const [forWhomIds, setForWhomIds] = useState([]);
  const [currency, setCurrency] = useState("");
  const [category, setCategory] = useState("∅"); // default to null symbol
  const userChangedCategory = useRef(false);

  // Fetch members when testGroup changes
  async function fetchMembers(groupId) {
    if (!token || !groupId) return;
    try {
      const data = await fetchSettleUpMembers(token, groupId);
      if (data) {
        const arr = Object.entries(data).map(([id, m]) => ({ id, ...m }));
        setMembers(arr);
        // Default: all active members for forWhom, first for payer
        setForWhomIds(arr.filter((m) => m.active !== false).map((m) => m.id));
        setPayerId(arr[0]?.id || "");
      }
    } catch (e) {
      setResult("Error fetching members: " + e.message);
    }
  }
  // Fetch group currency when testGroup changes
  function updateCurrency(group) {
    setCurrency(group?.convertedToCurrency || DEFAULT_CURRENCY);
  }
  // React to testGroup
  useEffect(() => {
    if (testGroup && testGroup.groupId) {
      fetchMembers(testGroup.groupId);
      updateCurrency(testGroup);
    } else {
      setMembers([]);
      setCurrency("");
    }
  }, [testGroup]);

  // Check permissions for the current user in the group
  async function checkWritePermission(groupId) {
    if (!token || !userId || !groupId) return;
    try {
      const perms = await fetchSettleUpPermissions(token, groupId);
      if (
        !perms ||
        !perms[userId] ||
        (perms[userId].level !== 20 && perms[userId].level !== 30)
      ) {
        setResult(
          <div className="text-red-700">
            You do not have write permission for this group.
            <br />
            Please ask the group owner to grant you write access in the Settle
            Up app.
          </div>,
        );
      } else {
        console.log("[SettleUp] User has write permission.");
      }
    } catch (e) {
      setResult("Error checking permissions: " + e.message);
      console.error("[SettleUp] Error checking permissions:", e);
    }
  }

  // Check if user is a member of the group
  async function checkMemberships() {
    if (testGroup && testGroup.groupId && token && userId) {
      await checkWritePermission(testGroup.groupId);
      // Check if user is a member
      try {
        const members = await fetchSettleUpMembers(token, testGroup.groupId);
        const isMember =
          members &&
          Object.values(members).some(
            (m) =>
              m &&
              m.active !== false &&
              m.name &&
              m.name.toLowerCase().includes("paul"),
          );
        if (!isMember) {
          setResult(
            <div className="text-red-700">
              Your user is not a member of this group.
              <br />
              Please add yourself as a member in the Settle Up app.
            </div>,
          );
        }
        // Check userGroup node
        const userGroup = await fetchSettleUpUserGroupNode(
          token,
          userId,
          testGroup.groupId,
        );
        if (!userGroup || Object.keys(userGroup).length === 0) {
          setResult(
            <div className="text-red-700">
              Your user is not linked to this group in userGroups.
              <br />
              Please join the group in the Settle Up app.
            </div>,
          );
        }
      } catch (e) {
        setResult("Error checking memberships: " + e.message);
      }
    }
  }

  // When testGroup is loaded, check write permission and membership
  useEffect(() => {
    checkMemberships();
  }, [testGroup, token, userId]);

  // Handle transaction submit
  async function handleAddTransaction(e) {
    e.preventDefault();
    setResult("");
    if (
      !token ||
      !testGroup?.groupId ||
      amountMilliunits === 0 ||
      !payerId ||
      forWhomIds.length === 0
    ) {
      setResult("❌ Please fill all required fields before submitting.");
      return;
    }
    // Convert milliunits to string amount (e.g. 1234 -> "1.23")
    const amount = (-amountMilliunits / 1000).toFixed(2);
    const now = Date.now();
    const tx = {
      category: category === "∅" ? "" : category,
      currencyCode: currency || "EUR",
      dateTime: now,
      items: [
        {
          amount: amount, // already string
          forWhom: forWhomIds.map((id) => ({ memberId: id, weight: "1" })),
        },
      ],
      purpose: desc,
      type: "expense",
      whoPaid: [{ memberId: payerId, weight: "1" }],
      fixedExchangeRate: false, // add optional field as in docs
      exchangeRates: undefined, // not needed if currency matches group
      receiptUrl: undefined, // not needed
    };
    console.log("[SettleUp] transaction payload:", tx);
    try {
      const data = await addSettleUpTransaction(token, testGroup.groupId, tx);
      if (data && data.name) {
        setResult(
          <div>
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <span>✅ Transaction sent!</span>
              <span className="text-xs text-gray-500">(ID: {data.name})</span>
            </div>
            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs overflow-x-auto max-h-40">
              {JSON.stringify(tx, null, 2)}
            </pre>
          </div>,
        );
        setAmountMilliunits(0);
        setDesc("");
      } else {
        setResult("Error adding transaction: " + JSON.stringify(data));
      }
    } catch (e) {
      setResult("Error adding transaction: " + e.message);
    }
  }

  // Autofill category based on previous transactions with same description
  useEffect(() => {
    if (!desc || !testGroup?.groupId || !token) return;
    // Debounce: only fetch after user stops typing for DEBOUNCE_AUTOFILL ms
    const handler = setTimeout(async () => {
      try {
        const data = await fetchSettleUpTransactions(token, testGroup.groupId);
        if (!data) {
          return;
        }
        const transactions = Object.values(data);
        // Use shared utility with 'contains' match
        const mostCommon = getMostCommonCategoryFromTransactions(
          transactions,
          desc,
          "purpose",
          "contains",
        );
        if (mostCommon && !userChangedCategory.current) {
          setCategory(mostCommon);
        }
      } catch (e) {
        // Ignore errors, just don't autofill
        console.warn("[SettleUp] Error fetching transactions for autofill:", e);
      }
    }, DEBOUNCE_AUTOFILL);
    return () => clearTimeout(handler);
  }, [desc, testGroup?.groupId, token]);

  // Reset userChangedCategory when desc changes
  useEffect(() => {
    userChangedCategory.current = false;
  }, [desc]);

  // UI
  if (loadingToken) {
    return <div className="text-sky-700">Loading Settle Up credentials...</div>;
  }
  if (tokenError) {
    return <div className="text-red-700 whitespace-pre-wrap">{tokenError}</div>;
  }

  return (
    <div className="space-y-4 w-full">
      {testGroup && (
        <div className="mt-4">
          {/* Transaction form */}
          <form
            className="space-y-3 mt-4"
            onSubmit={handleAddTransaction}
            autoComplete="off"
          >
            <h3 className="text-md font-bold text-sky-700 mb-1">
              Add Transaction to Group
            </h3>
            <AmountInput
              value={amountMilliunits}
              onChange={setAmountMilliunits}
            />
            <div className="flex items-center gap-2">
              <EmojiCategoryButton value={category} onChange={setCategory} />
              <input
                className="input input-bordered w-full px-3 py-2 border rounded"
                type="text"
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                style={{ height: 40 }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-1">
                Payer
              </label>
              <select
                className="input input-bordered w-full px-3 py-2 border rounded"
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                required
              >
                <option value="">Select payer</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-1">
                For Whom (split)
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={forWhomIds.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setForWhomIds((ids) => [...ids, m.id]);
                        else
                          setForWhomIds((ids) =>
                            ids.filter((id) => id !== m.id),
                          );
                      }}
                    />
                    <span>{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded w-full"
              type="submit"
              disabled={
                amountMilliunits === 0 || !payerId || forWhomIds.length === 0
              }
            >
              Add Transaction
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

SettleUpApiTestForm.propTypes = {
  setResult: PropTypes.func.isRequired,
};
